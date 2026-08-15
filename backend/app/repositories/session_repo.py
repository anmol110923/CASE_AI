from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import func, select
from sqlalchemy.orm import Session as DbSession, selectinload

from app.db.models import MessageRow, SessionRow
from app.models.schemas import Evaluation, Turn


def _empty_usage() -> dict:
    return {"calls": [], "session_total": 0}


@dataclass
class InterviewSession:
    id: str
    mode: str
    custom_prompt: str
    difficulty: str
    duration_minutes: int
    focus_areas: list[str]
    resume_text: str | None
    system_prompt: str
    context_summary: str | None
    turns: list[Turn]
    status: str
    created_at: datetime
    evaluation: Evaluation | None
    token_usage: dict
    target_turns: int
    completed_at: datetime | None = None


def _row_to_session(row: SessionRow) -> InterviewSession:
    evaluation = None
    if row.evaluation:
        evaluation = Evaluation.model_validate(row.evaluation)
    turns = [
        Turn(role=m.role, content=m.content, timestamp=m.created_at)  # type: ignore[arg-type]
        for m in sorted(row.messages, key=lambda x: x.sequence)
    ]
    return InterviewSession(
        id=row.id,
        mode=row.mode,
        custom_prompt=row.custom_prompt,
        difficulty=row.difficulty,
        duration_minutes=row.duration_minutes,
        focus_areas=list(row.focus_areas or []),
        resume_text=row.resume_text,
        system_prompt=row.system_prompt,
        context_summary=row.context_summary,
        turns=turns,
        status=row.status,
        created_at=row.created_at,
        evaluation=evaluation,
        token_usage=dict(row.token_usage or _empty_usage()),
        target_turns=row.target_turns,
        completed_at=row.completed_at,
    )


def create(
    db: DbSession,
    *,
    mode: str,
    custom_prompt: str,
    difficulty: str,
    duration_minutes: int,
    focus_areas: list[str],
    resume_text: str | None,
    system_prompt: str,
    target_turns: int,
) -> InterviewSession:
    row = SessionRow(
        id=str(uuid4()),
        mode=mode,
        custom_prompt=custom_prompt,
        difficulty=difficulty,
        duration_minutes=duration_minutes,
        focus_areas=focus_areas,
        resume_text=resume_text,
        system_prompt=system_prompt,
        context_summary=None,
        target_turns=target_turns,
        status="active",
        evaluation=None,
        token_usage=_empty_usage(),
        created_at=datetime.now(timezone.utc),
    )
    db.add(row)
    db.flush()
    db.refresh(row)
    return _row_to_session(row)


def get(db: DbSession, session_id: str) -> InterviewSession | None:
    row = db.scalar(
        select(SessionRow)
        .options(selectinload(SessionRow.messages))
        .where(SessionRow.id == session_id)
    )
    if row is None:
        return None
    return _row_to_session(row)


def list_sessions(db: DbSession, limit: int = 50) -> list[SessionRow]:
    stmt = select(SessionRow).order_by(SessionRow.created_at.desc()).limit(limit)
    return list(db.scalars(stmt).all())


def add_turn(db: DbSession, session_id: str, role: str, content: str) -> Turn:
    row = db.get(SessionRow, session_id)
    if row is None:
        raise KeyError(session_id)
    count = db.scalar(
        select(func.count()).select_from(MessageRow).where(MessageRow.session_id == session_id)
    ) or 0
    sequence = int(count) + 1
    now = datetime.now(timezone.utc)
    message = MessageRow(
        session_id=session_id,
        role=role,
        content=content,
        sequence=sequence,
        created_at=now,
    )
    db.add(message)
    db.flush()
    return Turn(role=role, content=content, timestamp=now)  # type: ignore[arg-type]


def set_status(db: DbSession, session_id: str, status: str) -> None:
    row = db.get(SessionRow, session_id)
    if row is None:
        raise KeyError(session_id)
    row.status = status


def set_evaluation(db: DbSession, session_id: str, evaluation: Evaluation) -> None:
    row = db.get(SessionRow, session_id)
    if row is None:
        raise KeyError(session_id)
    row.evaluation = evaluation.model_dump()
    row.status = "complete"
    row.completed_at = datetime.now(timezone.utc)


def set_context_summary(db: DbSession, session_id: str, summary: str) -> None:
    row = db.get(SessionRow, session_id)
    if row is None:
        raise KeyError(session_id)
    row.context_summary = summary


def record_usage(db: DbSession, session_id: str, call_type: str, usage: dict) -> dict:
    row = db.get(SessionRow, session_id)
    if row is None:
        raise KeyError(session_id)
    data = dict(row.token_usage or _empty_usage())
    calls = list(data.get("calls") or [])
    prompt = int(usage.get("prompt") or 0)
    output = int(usage.get("output") or 0)
    total = int(usage.get("total") or (prompt + output))
    calls.append({"type": call_type, "prompt": prompt, "output": output, "total": total})
    session_total = int(data.get("session_total") or 0) + total
    updated = {"calls": calls, "session_total": session_total}
    row.token_usage = updated
    return updated
