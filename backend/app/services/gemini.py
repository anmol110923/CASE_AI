import json
import re

import google.generativeai as genai

from app.config import settings
from app.models.schemas import Evaluation, DimensionScore, Difficulty, InterviewType, Turn

TYPE_RUBRICS = {
    "product_management": (
        "Focus on user needs, prioritization frameworks, metrics "
        "(North Star, funnel), trade-offs, and execution."
    ),
    "consulting": (
        "Focus on MECE structure, hypothesis-driven analysis, "
        "quantitative estimation, and synthesis."
    ),
    "general": (
        "Blend of structure, analysis, and recommendation. "
        "Probe both product and consulting instincts."
    ),
}

TARGET_TURNS = {15: 7, 30: 13, 45: 20}

DIMENSION_KEYS = [
    "problem_framing",
    "structure",
    "analytical_reasoning",
    "business_judgment",
    "metrics",
    "segmentation",
    "prioritization",
    "creativity",
    "communication",
    "depth_of_reasoning",
    "handling_challenges",
]


def target_turns_for(duration_minutes: int) -> int:
    return TARGET_TURNS.get(duration_minutes, 13)


def build_system_prompt(
    case_prompt: str,
    interview_type: InterviewType,
    difficulty: Difficulty,
    duration_minutes: int,
) -> str:
    type_label = {
        "product_management": "Product Management",
        "consulting": "Consulting",
        "general": "General Case",
    }[interview_type]
    target = target_turns_for(duration_minutes)
    return f"""ROLE
You are a senior {type_label} interviewer conducting a live case interview.
You are demanding, direct, and professional — not a friendly tutor.

CASE
{case_prompt}

INTERVIEW PARAMETERS
- Difficulty: {difficulty}
- Duration: {duration_minutes} minutes (~{target} Q&A exchanges)
- Type-specific focus: {TYPE_RUBRICS[interview_type]}

BEHAVIOR RULES
1. Ask exactly ONE question at a time.
2. Never reveal the answer or lead the candidate toward a specific solution.
3. Challenge weak assumptions. Ask "why?" and "how would you validate that?"
4. Probe structure, metrics, segmentation, prioritization, and business judgment.
5. Adapt based on answers: increase difficulty when strong, dig into weak areas.
6. Push back on vague or hand-wavy reasoning.
7. Stay in character as a real interviewer, not a coach.

DIFFICULTY CALIBRATION
- Easy: more guidance on structure, gentler pushback
- Medium: standard consulting/PM bar
- Hard: aggressive challenges, introduce complications, less patience for gaps

OUTPUT FORMAT
Respond in JSON only:
{{ "next_question": "...", "should_end": false, "difficulty_adjustment": "maintain|increase|decrease" }}
"""


def _configure() -> None:
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is not set")
    genai.configure(api_key=settings.gemini_api_key)


def _model(system_instruction: str):
    _configure()
    return genai.GenerativeModel(
        model_name=settings.gemini_model,
        system_instruction=system_instruction,
        generation_config={
            "response_mime_type": "application/json",
            "temperature": 0.7,
        },
    )


def _parse_json(text: str) -> dict:
    text = text.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        text = fence.group(1).strip()
    return json.loads(text)


def _format_transcript(turns: list[Turn]) -> str:
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


def generate_opening_question(system_prompt: str) -> dict:
    model = _model(system_prompt)
    response = model.generate_content(
        "Begin the interview. Greet the candidate briefly, then ask your opening question "
        "to start the case. Output JSON only."
    )
    return _turn_payload(response.text)


def generate_next_turn(
    system_prompt: str,
    turns: list[Turn],
    candidate_answer: str,
    turns_remaining: int,
) -> dict:
    model = _model(system_prompt)
    prior = _format_transcript(turns)
    prompt = (
        f"INTERVIEW SO FAR\n{prior}\n\n"
        f"LATEST CANDIDATE ANSWER\n{candidate_answer}\n\n"
        f"Turns remaining (including this follow-up): {turns_remaining}.\n"
        "Evaluate the answer internally. Ask one probing follow-up. "
        "If the interview should wrap up (time/turns exhausted or you have enough signal), "
        "set should_end to true and ask a closing synthesis question. JSON only."
    )
    response = model.generate_content(prompt)
    return _turn_payload(response.text, force_end=turns_remaining <= 1)


def generate_evaluation(
    case_prompt: str,
    interview_type: InterviewType,
    difficulty: Difficulty,
    turns: list[Turn],
) -> Evaluation:
    transcript_lines = []
    for turn in turns:
        label = "Interviewer" if turn.role == "interviewer" else "Candidate"
        transcript_lines.append(f"{label}: {turn.content}")
    transcript = "\n\n".join(transcript_lines)

    prompt = f"""You are scoring a completed case interview. Be rigorous and specific.

CASE
{case_prompt}

INTERVIEW TYPE: {interview_type}
DIFFICULTY: {difficulty}

TRANSCRIPT
{transcript}

Score each dimension 1-10 and give a short explanation citing the transcript.
overall_score is 0-100.

Return JSON only with this exact shape:
{{
  "overall_score": 0,
  "dimensions": {{
    "problem_framing": {{ "score": 0, "explanation": "" }},
    "structure": {{ "score": 0, "explanation": "" }},
    "analytical_reasoning": {{ "score": 0, "explanation": "" }},
    "business_judgment": {{ "score": 0, "explanation": "" }},
    "metrics": {{ "score": 0, "explanation": "" }},
    "segmentation": {{ "score": 0, "explanation": "" }},
    "prioritization": {{ "score": 0, "explanation": "" }},
    "creativity": {{ "score": 0, "explanation": "" }},
    "communication": {{ "score": 0, "explanation": "" }},
    "depth_of_reasoning": {{ "score": 0, "explanation": "" }},
    "handling_challenges": {{ "score": 0, "explanation": "" }}
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
    _configure()
    model = genai.GenerativeModel(
        model_name=settings.gemini_model,
        generation_config={
            "response_mime_type": "application/json",
            "temperature": 0.3,
        },
    )
    response = model.generate_content(prompt)
    data = _parse_json(response.text)

    dimensions: dict[str, DimensionScore] = {}
    raw_dims = data.get("dimensions", {})
    for key in DIMENSION_KEYS:
        item = raw_dims.get(key, {})
        dimensions[key] = DimensionScore(
            score=int(item.get("score", 0)),
            explanation=str(item.get("explanation", "")),
        )

    return Evaluation(
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
