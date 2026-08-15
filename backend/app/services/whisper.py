from functools import lru_cache

from faster_whisper import WhisperModel

from app.config import settings


@lru_cache(maxsize=1)
def get_model() -> WhisperModel:
    return WhisperModel(settings.whisper_model, device="cpu", compute_type="int8")


def transcribe_audio(path: str) -> str:
    model = get_model()
    segments, _info = model.transcribe(path, beam_size=1)
    return " ".join(segment.text.strip() for segment in segments).strip()
