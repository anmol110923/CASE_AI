from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

InterviewMode = Literal[
    "pm_cases",
    "resume_round",
    "hr_round",
    "technical_round",
    "consulting_round",
]
Difficulty = Literal["easy", "medium", "hard"]
SessionStatus = Literal["active", "evaluating", "complete"]
TurnRole = Literal["interviewer", "candidate"]
DurationMinutes = Literal[15, 30, 45]


class CreateSessionRequest(BaseModel):
    mode: InterviewMode
    custom_prompt: str = Field(min_length=10)
    difficulty: Difficulty
    duration_minutes: DurationMinutes
    focus_areas: list[str] = Field(default_factory=list)
    resume_text: str | None = None


class Turn(BaseModel):
    role: TurnRole
    content: str
    timestamp: datetime


class DimensionScore(BaseModel):
    score: int
    explanation: str


class Evaluation(BaseModel):
    overall_score: int
    dimensions: dict[str, DimensionScore]
    strongest_areas: list[str]
    weakest_areas: list[str]
    specific_mistakes: list[str]
    missed_opportunities: list[str]
    struggled_questions: list[str]
    practice_recommendations: list[str]
    final_recommendation: str


class TokenCall(BaseModel):
    type: str
    prompt: int
    output: int
    total: int


class TokenUsage(BaseModel):
    calls: list[TokenCall] = Field(default_factory=list)
    session_total: int = 0


class SessionResponse(BaseModel):
    id: str
    mode: InterviewMode
    custom_prompt: str
    difficulty: Difficulty
    duration_minutes: int
    focus_areas: list[str]
    status: SessionStatus
    created_at: datetime
    turns: list[Turn]
    current_question: str | None = None
    evaluation: Evaluation | None = None
    context_summary: str | None = None
    token_usage: TokenUsage | None = None


class SessionSummary(BaseModel):
    id: str
    mode: InterviewMode
    difficulty: Difficulty
    duration_minutes: int
    status: SessionStatus
    created_at: datetime
    overall_score: int | None = None
    focus_areas: list[str] = Field(default_factory=list)


class SessionDebug(BaseModel):
    session_id: str
    message_count: int
    exchange_count: int
    window_exchanges: int
    recent_turn_count: int
    summary_length: int
    context_summary: str | None
    token_usage: TokenUsage
    interviewer_model: str
    eval_model: str
    summary_model: str


class SubmitTurnRequest(BaseModel):
    answer: str = Field(min_length=1)


class TranscribeResponse(BaseModel):
    transcript: str
