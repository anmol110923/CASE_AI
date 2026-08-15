from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

InterviewType = Literal["product_management", "consulting", "general"]
Difficulty = Literal["easy", "medium", "hard"]
SessionStatus = Literal["active", "evaluating", "complete"]
TurnRole = Literal["interviewer", "candidate"]
DurationMinutes = Literal[15, 30, 45]


class CreateSessionRequest(BaseModel):
    case_prompt: str = Field(min_length=10)
    interview_type: InterviewType
    difficulty: Difficulty
    duration_minutes: DurationMinutes


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


class SessionResponse(BaseModel):
    id: str
    case_prompt: str
    interview_type: InterviewType
    difficulty: Difficulty
    duration_minutes: int
    status: SessionStatus
    created_at: datetime
    turns: list[Turn]
    current_question: str | None = None
    evaluation: Evaluation | None = None


class SubmitTurnRequest(BaseModel):
    answer: str = Field(min_length=1)


class TranscribeResponse(BaseModel):
    transcript: str
