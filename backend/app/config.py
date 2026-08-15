from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"
_BACKEND_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    gemini_api_key: str = ""
    gemini_model: str = "gemini-flash-latest"
    gemini_model_interviewer: str = ""
    gemini_model_eval: str = ""
    gemini_model_summary: str = ""
    whisper_model: str = "small"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    context_window_turns: int = 10
    max_output_tokens_interviewer: int = 256
    max_output_tokens_eval: int = 1500
    max_output_tokens_summary: int = 512
    debug: bool = True
    database_url: str = f"sqlite:///{_BACKEND_ROOT / 'data' / 'case_ai.db'}"

    @property
    def interviewer_model_name(self) -> str:
        return self.gemini_model_interviewer or self.gemini_model

    @property
    def eval_model_name(self) -> str:
        return self.gemini_model_eval or self.gemini_model

    @property
    def summary_model_name(self) -> str:
        return self.gemini_model_summary or self.gemini_model_interviewer or self.gemini_model


settings = Settings()
