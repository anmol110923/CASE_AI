import type { InterviewMode } from "./modes";

export type Difficulty = "easy" | "medium" | "hard";
export type SessionStatus = "active" | "evaluating" | "complete";
export type DurationMinutes = 15 | 30 | 45;

export type Turn = {
  role: "interviewer" | "candidate";
  content: string;
  timestamp: string;
};

export type DimensionScore = {
  score: number;
  explanation: string;
};

export type Evaluation = {
  overall_score: number;
  dimensions: Record<string, DimensionScore>;
  strongest_areas: string[];
  weakest_areas: string[];
  specific_mistakes: string[];
  missed_opportunities: string[];
  struggled_questions: string[];
  practice_recommendations: string[];
  final_recommendation: string;
};

export type TokenCall = {
  type: string;
  prompt: number;
  output: number;
  total: number;
};

export type TokenUsage = {
  calls: TokenCall[];
  session_total: number;
};

export type Session = {
  id: string;
  mode: InterviewMode;
  custom_prompt: string;
  difficulty: Difficulty;
  duration_minutes: number;
  focus_areas: string[];
  status: SessionStatus;
  created_at: string;
  turns: Turn[];
  current_question: string | null;
  evaluation: Evaluation | null;
  context_summary?: string | null;
  token_usage?: TokenUsage | null;
};

export type SessionSummary = {
  id: string;
  mode: InterviewMode;
  difficulty: Difficulty;
  duration_minutes: number;
  status: SessionStatus;
  created_at: string;
  overall_score: number | null;
  focus_areas: string[];
};

export type SessionDebug = {
  session_id: string;
  message_count: number;
  exchange_count: number;
  window_exchanges: number;
  recent_turn_count: number;
  summary_length: number;
  context_summary: string | null;
  token_usage: TokenUsage;
  interviewer_model: string;
  eval_model: string;
  summary_model: string;
};

export type CreateSessionPayload = {
  mode: InterviewMode;
  custom_prompt: string;
  difficulty: Difficulty;
  duration_minutes: DurationMinutes;
  focus_areas: string[];
  resume_text?: string | null;
};
