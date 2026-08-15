export type InterviewType = "product_management" | "consulting" | "general";
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

export type Session = {
  id: string;
  case_prompt: string;
  interview_type: InterviewType;
  difficulty: Difficulty;
  duration_minutes: number;
  status: SessionStatus;
  created_at: string;
  turns: Turn[];
  current_question: string | null;
  evaluation: Evaluation | null;
};

export type CreateSessionPayload = {
  case_prompt: string;
  interview_type: InterviewType;
  difficulty: Difficulty;
  duration_minutes: DurationMinutes;
};
