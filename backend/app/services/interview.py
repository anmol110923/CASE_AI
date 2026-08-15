from datetime import datetime, timezone

from fastapi import HTTPException

from app.models.schemas import (
    CreateSessionRequest,
    Evaluation,
    SessionResponse,
    Turn,
)
from app.services import gemini
from app.store import sessions as store
from app.store.sessions import InterviewSession


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
    return SessionResponse(
        id=session.id,
        case_prompt=session.case_prompt,
        interview_type=session.interview_type,
        difficulty=session.difficulty,
        duration_minutes=session.duration_minutes,
        status=session.status,
        created_at=session.created_at,
        turns=session.turns,
        current_question=_current_question(session),
        evaluation=session.evaluation,
    )


def get_session(session_id: str) -> InterviewSession:
    session = store.get(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


def create_session(payload: CreateSessionRequest) -> SessionResponse:
    target_turns = gemini.target_turns_for(payload.duration_minutes)
    system_prompt = gemini.build_system_prompt(
        payload.case_prompt,
        payload.interview_type,
        payload.difficulty,
        payload.duration_minutes,
    )
    session = store.create(
        case_prompt=payload.case_prompt,
        interview_type=payload.interview_type,
        difficulty=payload.difficulty,
        duration_minutes=payload.duration_minutes,
        system_prompt=system_prompt,
        target_turns=target_turns,
    )
    result = _gemini_call(gemini.generate_opening_question, system_prompt)
    store.add_turn(
        session,
        Turn(
            role="interviewer",
            content=result["next_question"],
            timestamp=datetime.now(timezone.utc),
        ),
    )
    return to_response(session)


def submit_turn(session_id: str, answer: str) -> SessionResponse:
    session = get_session(session_id)
    if session.status != "active":
        raise HTTPException(status_code=400, detail="Interview is not active")

    store.add_turn(
        session,
        Turn(role="candidate", content=answer.strip(), timestamp=datetime.now(timezone.utc)),
    )

    candidate_turns = sum(1 for t in session.turns if t.role == "candidate")
    turns_remaining = max(session.target_turns - candidate_turns, 0)

    result = _gemini_call(
        gemini.generate_next_turn,
        session.system_prompt,
        session.turns[:-1],
        answer.strip(),
        turns_remaining,
    )
    store.add_turn(
        session,
        Turn(
            role="interviewer",
            content=result["next_question"],
            timestamp=datetime.now(timezone.utc),
        ),
    )
    if result["should_end"]:
        return end_interview(session_id)
    return to_response(session)


def end_interview(session_id: str) -> SessionResponse:
    session = get_session(session_id)
    if session.status == "complete" and session.evaluation is not None:
        return to_response(session)
    store.set_status(session, "evaluating")
    try:
        evaluation: Evaluation = _gemini_call(
            gemini.generate_evaluation,
            session.case_prompt,
            session.interview_type,
            session.difficulty,
            session.turns,
        )
    except HTTPException:
        store.set_status(session, "active")
        raise
    store.set_evaluation(session, evaluation)
    return to_response(session)
