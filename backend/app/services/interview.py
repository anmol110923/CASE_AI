from fastapi import HTTPException
from sqlalchemy.orm import Session as DbSession

from app.config import settings
from app.models.schemas import (
    CreateSessionRequest,
    Evaluation,
    SessionDebug,
    SessionResponse,
    SessionSummary,
    TokenUsage,
)
from app.repositories import session_repo as store
from app.repositories.session_repo import InterviewSession
from app.services import gemini
from app.services.context import split_window
from app.services.prompts import build_system_prompt, target_turns_for


def _gemini_call(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


def _current_question(session: InterviewSession) -> str | None:
    for turn in reversed(session.turns):
        if turn.role == "interviewer":
            return turn.content
    return None


def to_response(session: InterviewSession) -> SessionResponse:
    usage = TokenUsage.model_validate(session.token_usage or {"calls": [], "session_total": 0})
    return SessionResponse(
        id=session.id,
        mode=session.mode,  # type: ignore[arg-type]
        custom_prompt=session.custom_prompt,
        difficulty=session.difficulty,  # type: ignore[arg-type]
        duration_minutes=session.duration_minutes,
        focus_areas=session.focus_areas,
        status=session.status,  # type: ignore[arg-type]
        created_at=session.created_at,
        turns=session.turns,
        current_question=_current_question(session),
        evaluation=session.evaluation,
        context_summary=session.context_summary if settings.debug else None,
        token_usage=usage if settings.debug else None,
    )


def get_session(db: DbSession, session_id: str) -> InterviewSession:
    session = store.get(db, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


def list_history(db: DbSession, limit: int = 50) -> list[SessionSummary]:
    rows = store.list_sessions(db, limit=limit)
    items: list[SessionSummary] = []
    for row in rows:
        score = None
        if row.evaluation and isinstance(row.evaluation, dict):
            raw = row.evaluation.get("overall_score")
            if raw is not None:
                score = int(raw)
        items.append(
            SessionSummary(
                id=row.id,
                mode=row.mode,  # type: ignore[arg-type]
                difficulty=row.difficulty,  # type: ignore[arg-type]
                duration_minutes=row.duration_minutes,
                status=row.status,  # type: ignore[arg-type]
                created_at=row.created_at,
                overall_score=score,
                focus_areas=list(row.focus_areas or []),
            )
        )
    return items


def debug_session(db: DbSession, session_id: str) -> SessionDebug:
    if not settings.debug:
        raise HTTPException(status_code=404, detail="Debug is disabled")
    session = get_session(db, session_id)
    _older, recent = split_window(session.turns, settings.context_window_turns)
    usage = TokenUsage.model_validate(session.token_usage or {"calls": [], "session_total": 0})
    summary = session.context_summary or ""
    return SessionDebug(
        session_id=session.id,
        message_count=len(session.turns),
        exchange_count=len(session.turns) // 2,
        window_exchanges=settings.context_window_turns,
        recent_turn_count=len(recent),
        summary_length=len(summary),
        context_summary=session.context_summary,
        token_usage=usage,
        interviewer_model=settings.interviewer_model_name,
        eval_model=settings.eval_model_name,
        summary_model=settings.summary_model_name,
    )


def create_session(db: DbSession, payload: CreateSessionRequest) -> SessionResponse:
    target_turns = target_turns_for(payload.duration_minutes)
    focus = [tag.strip() for tag in payload.focus_areas if tag.strip()]
    system_prompt = build_system_prompt(
        payload.mode,
        payload.custom_prompt,
        payload.difficulty,
        payload.duration_minutes,
        focus,
        payload.resume_text,
    )
    session = store.create(
        db,
        mode=payload.mode,
        custom_prompt=payload.custom_prompt,
        difficulty=payload.difficulty,
        duration_minutes=payload.duration_minutes,
        focus_areas=focus,
        resume_text=payload.resume_text,
        system_prompt=system_prompt,
        target_turns=target_turns,
    )
    result, usage = _gemini_call(gemini.generate_opening_question, system_prompt)
    store.record_usage(db, session.id, "interviewer", usage)
    store.add_turn(db, session.id, "interviewer", result["next_question"])
    db.commit()
    return to_response(get_session(db, session.id))


def _maybe_summarize(db: DbSession, session: InterviewSession) -> None:
    older, _recent = split_window(session.turns, settings.context_window_turns)
    if not older:
        return
    summary, usage = _gemini_call(
        gemini.summarize_history,
        older,
        session.context_summary,
    )
    store.record_usage(db, session.id, "summary", usage)
    store.set_context_summary(db, session.id, summary)


def submit_turn(db: DbSession, session_id: str, answer: str) -> SessionResponse:
    session = get_session(db, session_id)
    if session.status != "active":
        raise HTTPException(status_code=400, detail="Interview is not active")

    store.add_turn(db, session_id, "candidate", answer.strip())
    session = get_session(db, session_id)

    candidate_turns = sum(1 for t in session.turns if t.role == "candidate")
    turns_remaining = max(session.target_turns - candidate_turns, 0)

    prior = session.turns[:-1]
    older, recent = split_window(prior, settings.context_window_turns)
    if older and not session.context_summary:
        summary, usage = _gemini_call(gemini.summarize_history, older, None)
        store.record_usage(db, session_id, "summary", usage)
        store.set_context_summary(db, session_id, summary)
        session = get_session(db, session_id)

    context_summary = session.context_summary if older else None
    result, usage = _gemini_call(
        gemini.generate_next_turn,
        session.system_prompt,
        context_summary,
        recent,
        answer.strip(),
        turns_remaining,
    )
    store.record_usage(db, session_id, "interviewer", usage)
    store.add_turn(db, session_id, "interviewer", result["next_question"])

    session = get_session(db, session_id)
    _maybe_summarize(db, session)

    if result["should_end"]:
        db.commit()
        return end_interview(db, session_id)

    db.commit()
    return to_response(get_session(db, session_id))


def end_interview(db: DbSession, session_id: str) -> SessionResponse:
    session = get_session(db, session_id)
    if session.status == "complete" and session.evaluation is not None:
        return to_response(session)
    store.set_status(db, session_id, "evaluating")
    db.commit()
    try:
        evaluation: Evaluation
        evaluation, usage = _gemini_call(
            gemini.generate_evaluation,
            session.custom_prompt,
            session.mode,
            session.difficulty,
            session.turns,
        )
    except HTTPException:
        store.set_status(db, session_id, "active")
        db.commit()
        raise
    store.record_usage(db, session_id, "eval", usage)
    store.set_evaluation(db, session_id, evaluation)
    db.commit()
    return to_response(get_session(db, session_id))
