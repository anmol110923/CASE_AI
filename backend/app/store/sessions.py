from dataclasses import dataclass, field
from datetime import datetime, timezone
from uuid import uuid4

from app.models.schemas import Evaluation, InterviewType, Difficulty, SessionStatus, Turn


@dataclass
class InterviewSession:
    id: str
    case_prompt: str
    interview_type: InterviewType
    difficulty: Difficulty
    duration_minutes: int
    system_prompt: str
    turns: list[Turn] = field(default_factory=list)
    status: SessionStatus = "active"
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    evaluation: Evaluation | None = None
    target_turns: int = 7


_sessions: dict[str, InterviewSession] = {}


def create(
    case_prompt: str,
    interview_type: InterviewType,
    difficulty: Difficulty,
    duration_minutes: int,
    system_prompt: str,
    target_turns: int,
) -> InterviewSession:
    session = InterviewSession(
        id=str(uuid4()),
        case_prompt=case_prompt,
        interview_type=interview_type,
        difficulty=difficulty,
        duration_minutes=duration_minutes,
        system_prompt=system_prompt,
        target_turns=target_turns,
    )
    _sessions[session.id] = session
    return session


def get(session_id: str) -> InterviewSession | None:
    return _sessions.get(session_id)


def add_turn(session: InterviewSession, turn: Turn) -> None:
    session.turns.append(turn)


def set_status(session: InterviewSession, status: SessionStatus) -> None:
    session.status = status


def set_evaluation(session: InterviewSession, evaluation: Evaluation) -> None:
    session.evaluation = evaluation
    session.status = "complete"
