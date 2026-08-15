from fastapi import APIRouter

from app.models.schemas import CreateSessionRequest, SessionResponse, SubmitTurnRequest
from app.services import interview

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("", response_model=SessionResponse)
def create_session(payload: CreateSessionRequest) -> SessionResponse:
    return interview.create_session(payload)


@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: str) -> SessionResponse:
    return interview.to_response(interview.get_session(session_id))


@router.post("/{session_id}/turns", response_model=SessionResponse)
def submit_turn(session_id: str, payload: SubmitTurnRequest) -> SessionResponse:
    return interview.submit_turn(session_id, payload.answer)


@router.post("/{session_id}/end", response_model=SessionResponse)
def end_interview(session_id: str) -> SessionResponse:
    return interview.end_interview(session_id)


@router.get("/{session_id}/evaluation", response_model=SessionResponse)
def get_evaluation(session_id: str) -> SessionResponse:
    session = interview.get_session(session_id)
    if session.evaluation is None:
        return interview.end_interview(session_id)
    return interview.to_response(session)
