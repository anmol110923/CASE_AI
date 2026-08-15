from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session as DbSession

from app.db.base import SessionLocal
from app.models.schemas import (
    CreateSessionRequest,
    SessionDebug,
    SessionResponse,
    SessionSummary,
    SubmitTurnRequest,
)
from app.services import interview
from app.services.pdf import extract_pdf_text

router = APIRouter(prefix="/sessions", tags=["sessions"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("", response_model=list[SessionSummary])
def list_sessions(limit: int = 50, db: DbSession = Depends(get_db)) -> list[SessionSummary]:
    return interview.list_history(db, limit=min(max(limit, 1), 200))


@router.post("", response_model=SessionResponse)
def create_session(payload: CreateSessionRequest, db: DbSession = Depends(get_db)) -> SessionResponse:
    return interview.create_session(db, payload)


@router.post("/with-resume", response_model=SessionResponse)
async def create_session_with_resume(
    custom_prompt: str = Form(...),
    difficulty: str = Form(...),
    duration_minutes: int = Form(...),
    focus_areas: str = Form(""),
    resume_text: str = Form(""),
    resume_pdf: UploadFile | None = File(None),
    db: DbSession = Depends(get_db),
) -> SessionResponse:
    if difficulty not in ("easy", "medium", "hard"):
        raise HTTPException(status_code=400, detail="Invalid difficulty")
    if duration_minutes not in (15, 30, 45):
        raise HTTPException(status_code=400, detail="Duration must be 15, 30, or 45")
    if len(custom_prompt.strip()) < 10:
        raise HTTPException(status_code=400, detail="custom_prompt must be at least 10 characters")

    parsed_resume = resume_text.strip()
    if resume_pdf is not None and resume_pdf.filename:
        data = await resume_pdf.read()
        if data:
            extracted = extract_pdf_text(data)
            if not extracted:
                raise HTTPException(
                    status_code=400,
                    detail="Could not extract text from PDF. Use a text-based PDF or paste the resume.",
                )
            parsed_resume = f"{parsed_resume}\n\n{extracted}".strip() if parsed_resume else extracted

    tags = [part.strip() for part in focus_areas.split(",") if part.strip()]
    payload = CreateSessionRequest(
        mode="resume_round",
        custom_prompt=custom_prompt.strip(),
        difficulty=difficulty,  # type: ignore[arg-type]
        duration_minutes=duration_minutes,  # type: ignore[arg-type]
        focus_areas=tags,
        resume_text=parsed_resume or None,
    )
    return interview.create_session(db, payload)


@router.get("/{session_id}/debug", response_model=SessionDebug)
def get_session_debug(session_id: str, db: DbSession = Depends(get_db)) -> SessionDebug:
    return interview.debug_session(db, session_id)


@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: str, db: DbSession = Depends(get_db)) -> SessionResponse:
    return interview.to_response(interview.get_session(db, session_id))


@router.post("/{session_id}/turns", response_model=SessionResponse)
def submit_turn(
    session_id: str,
    payload: SubmitTurnRequest,
    db: DbSession = Depends(get_db),
) -> SessionResponse:
    return interview.submit_turn(db, session_id, payload.answer)


@router.post("/{session_id}/end", response_model=SessionResponse)
def end_interview(session_id: str, db: DbSession = Depends(get_db)) -> SessionResponse:
    return interview.end_interview(db, session_id)


@router.get("/{session_id}/evaluation", response_model=SessionResponse)
def get_evaluation(session_id: str, db: DbSession = Depends(get_db)) -> SessionResponse:
    session = interview.get_session(db, session_id)
    if session.evaluation is None:
        return interview.end_interview(db, session_id)
    return interview.to_response(session)
