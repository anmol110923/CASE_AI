import os
import tempfile

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.models.schemas import TranscribeResponse
from app.services.whisper import transcribe_audio

router = APIRouter(tags=["transcribe"])


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe(audio: UploadFile = File(...)) -> TranscribeResponse:
    suffix = os.path.splitext(audio.filename or "recording.webm")[1] or ".webm"
    contents = await audio.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty audio file")

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name
        transcript = transcribe_audio(tmp_path)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {exc}") from exc
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

    return TranscribeResponse(transcript=transcript)
