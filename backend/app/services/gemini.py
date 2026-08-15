import json
import re

import google.generativeai as genai

from app.config import settings
from app.models.schemas import DimensionScore, Evaluation, InterviewMode, Turn
from app.services.prompts import dimension_keys_for


def _configure() -> None:
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is not set")
    genai.configure(api_key=settings.gemini_api_key)


def extract_usage(response) -> dict:
    meta = getattr(response, "usage_metadata", None)
    if meta is None:
        return {"prompt": 0, "output": 0, "total": 0}
    prompt = int(getattr(meta, "prompt_token_count", 0) or 0)
    output = int(getattr(meta, "candidates_token_count", 0) or 0)
    total = int(getattr(meta, "total_token_count", 0) or 0) or (prompt + output)
    return {"prompt": prompt, "output": output, "total": total}


def _interviewer_model(system_instruction: str):
    _configure()
    return genai.GenerativeModel(
        model_name=settings.interviewer_model_name,
        system_instruction=system_instruction,
        generation_config={
            "response_mime_type": "application/json",
            "temperature": 0.7,
            "max_output_tokens": settings.max_output_tokens_interviewer,
        },
    )


def _eval_model():
    _configure()
    return genai.GenerativeModel(
        model_name=settings.eval_model_name,
        generation_config={
            "response_mime_type": "application/json",
            "temperature": 0.3,
            "max_output_tokens": settings.max_output_tokens_eval,
        },
    )


def _summary_model():
    _configure()
    return genai.GenerativeModel(
        model_name=settings.summary_model_name,
        generation_config={
            "temperature": 0.2,
            "max_output_tokens": settings.max_output_tokens_summary,
        },
    )


def _parse_json(text: str) -> dict:
    text = text.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        text = fence.group(1).strip()
    return json.loads(text)


def format_transcript(turns: list[Turn]) -> str:
    lines: list[str] = []
    for turn in turns:
        label = "Interviewer" if turn.role == "interviewer" else "Candidate"
        lines.append(f"{label}: {turn.content}")
    return "\n\n".join(lines)


def _turn_payload(text: str, force_end: bool = False) -> dict:
    try:
        data = _parse_json(text)
    except (json.JSONDecodeError, ValueError):
        return {
            "next_question": text.strip(),
            "should_end": force_end,
            "difficulty_adjustment": "maintain",
        }
    return {
        "next_question": str(data.get("next_question") or text.strip()),
        "should_end": bool(data.get("should_end", False)) or force_end,
        "difficulty_adjustment": str(data.get("difficulty_adjustment", "maintain")),
    }


def generate_opening_question(system_prompt: str) -> tuple[dict, dict]:
    model = _interviewer_model(system_prompt)
    response = model.generate_content(
        "Begin the interview. Greet the candidate briefly, then ask your opening question. "
        "Output JSON only."
    )
    return _turn_payload(response.text), extract_usage(response)


def generate_next_turn(
    system_prompt: str,
    context_summary: str | None,
    recent_turns: list[Turn],
    candidate_answer: str,
    turns_remaining: int,
) -> tuple[dict, dict]:
    model = _interviewer_model(system_prompt)
    parts: list[str] = []
    if context_summary:
        parts.append(f"PRIOR SUMMARY\n{context_summary}")
    prior = format_transcript(recent_turns)
    if prior:
        parts.append(f"RECENT EXCHANGES\n{prior}")
    parts.append(f"LATEST CANDIDATE ANSWER\n{candidate_answer}")
    parts.append(
        f"Turns remaining (including this follow-up): {turns_remaining}.\n"
        "Evaluate the answer internally. Ask one probing follow-up. "
        "If the interview should wrap up (time/turns exhausted or you have enough signal), "
        "set should_end to true and ask a closing synthesis question. JSON only."
    )
    response = model.generate_content("\n\n".join(parts))
    return _turn_payload(response.text, force_end=turns_remaining <= 1), extract_usage(response)


def summarize_history(
    older_turns: list[Turn],
    existing_summary: str | None,
) -> tuple[str, dict]:
    transcript = format_transcript(older_turns)
    prior = existing_summary.strip() if existing_summary else "(none)"
    prompt = (
        "Update the running interview summary. Be compact (bullet points).\n"
        "Cover: topics already asked, candidate strengths/weaknesses observed, "
        "numbers or frameworks they used, and anything to avoid repeating.\n\n"
        f"EXISTING SUMMARY\n{prior}\n\n"
        f"OLDER TURNS TO FOLD IN\n{transcript}\n\n"
        "Return only the updated summary text, no JSON."
    )
    model = _summary_model()
    response = model.generate_content(prompt)
    text = (response.text or "").strip()
    return text, extract_usage(response)


def generate_evaluation(
    custom_prompt: str,
    mode: InterviewMode,
    difficulty: str,
    turns: list[Turn],
) -> tuple[Evaluation, dict]:
    keys = dimension_keys_for(mode)
    dim_block = ",\n    ".join(f'"{k}": {{ "score": 0, "explanation": "" }}' for k in keys)
    transcript = format_transcript(turns)
    prompt = f"""You are scoring a completed interview. Be rigorous and specific.

MODE: {mode}
DIFFICULTY: {difficulty}

CANDIDATE-SUPPLIED CONTENT
{custom_prompt}

TRANSCRIPT
{transcript}

Score each dimension 1-10 and give a short explanation citing the transcript.
overall_score is 0-100.

Return JSON only with this exact shape:
{{
  "overall_score": 0,
  "dimensions": {{
    {dim_block}
  }},
  "strongest_areas": ["..."],
  "weakest_areas": ["..."],
  "specific_mistakes": ["..."],
  "missed_opportunities": ["..."],
  "struggled_questions": ["..."],
  "practice_recommendations": ["..."],
  "final_recommendation": "..."
}}
"""
    model = _eval_model()
    response = model.generate_content(prompt)
    data = _parse_json(response.text)

    dimensions: dict[str, DimensionScore] = {}
    raw_dims = data.get("dimensions", {})
    for key in keys:
        item = raw_dims.get(key, {})
        dimensions[key] = DimensionScore(
            score=int(item.get("score", 0)),
            explanation=str(item.get("explanation", "")),
        )

    evaluation = Evaluation(
        overall_score=int(data.get("overall_score", 0)),
        dimensions=dimensions,
        strongest_areas=list(data.get("strongest_areas", [])),
        weakest_areas=list(data.get("weakest_areas", [])),
        specific_mistakes=list(data.get("specific_mistakes", [])),
        missed_opportunities=list(data.get("missed_opportunities", [])),
        struggled_questions=list(data.get("struggled_questions", [])),
        practice_recommendations=list(data.get("practice_recommendations", [])),
        final_recommendation=str(data.get("final_recommendation", "")),
    )
    return evaluation, extract_usage(response)
