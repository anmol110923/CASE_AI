import {
  Briefcase,
  ClipboardList,
  Code2,
  Layers,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export const MODE_IDS = [
  "pm_cases",
  "resume_round",
  "hr_round",
  "technical_round",
  "consulting_round",
] as const;

export type InterviewMode = (typeof MODE_IDS)[number];

export type ModeConfig = {
  id: InterviewMode;
  label: string;
  shortLabel: string;
  description: string;
  setupHint: string;
  promptLabel: string;
  promptPlaceholder: string;
  icon: LucideIcon;
  dimensions: Record<string, string>;
};

/** Serializable subset safe to pass from Server Components to Client Components. */
export type ModeSetupProps = Pick<
  ModeConfig,
  "id" | "promptLabel" | "setupHint" | "promptPlaceholder"
>;

export function toModeSetupProps(mode: ModeConfig): ModeSetupProps {
  return {
    id: mode.id,
    promptLabel: mode.promptLabel,
    setupHint: mode.setupHint,
    promptPlaceholder: mode.promptPlaceholder,
  };
}

export const MODES: ModeConfig[] = [
  {
    id: "pm_cases",
    label: "PM Cases",
    shortLabel: "PM",
    description: "Product sense, guesstimates, design, metrics, and prioritization.",
    setupHint:
      "Paste case excerpts, a JD, or a question list. The interviewer will adapt from your content.",
    promptLabel: "Case content / custom prompt",
    promptPlaceholder:
      "Paste product cases, metrics questions, or a JD. Example: “Design a better onboarding for a payments app. Also cover a TAM guesstimate.”",
    icon: Layers,
    dimensions: {
      product_sense: "Product sense",
      guesstimation: "Guesstimation",
      prioritization: "Prioritization",
      metrics: "Metrics",
      communication: "Communication",
      synthesis: "Synthesis",
    },
  },
  {
    id: "resume_round",
    label: "Resume Round",
    shortLabel: "Resume",
    description: "Questions grounded in your resume, CV, and the role you are targeting.",
    setupHint:
      "Paste a JD or interviewer notes, then upload or paste your resume. Scanned PDFs will not parse.",
    promptLabel: "Job description / interviewer notes",
    promptPlaceholder:
      "Paste the JD, company, role, or specific themes you want probed (ownership, impact, leadership).",
    icon: UserRound,
    dimensions: {
      relevance: "Relevance",
      depth: "Depth",
      consistency: "Consistency",
      communication: "Communication",
      motivation: "Motivation",
    },
  },
  {
    id: "hr_round",
    label: "HR Round",
    shortLabel: "HR",
    description: "Behavioral and situational questions with STAR follow-ups.",
    setupHint: "Paste company values, a JD, or a list of behavioral prompts.",
    promptLabel: "Behavioral brief / custom prompt",
    promptPlaceholder:
      "Paste values, a culture doc, or questions like “Tell me about a conflict with a teammate.”",
    icon: ClipboardList,
    dimensions: {
      star_clarity: "STAR clarity",
      self_awareness: "Self-awareness",
      motivation: "Motivation",
      culture_fit: "Culture fit",
      communication: "Communication",
    },
  },
  {
    id: "technical_round",
    label: "Technical Round",
    shortLabel: "Technical",
    description: "Spoken technical Q&A on a stack or topic you specify.",
    setupHint: "Name the stack and paste notes or questions. This is Q&A, not a coding IDE.",
    promptLabel: "Stack / topic / question notes",
    promptPlaceholder:
      "e.g. “React + system design for a URL shortener. Also SQL + Python fundamentals.”",
    icon: Code2,
    dimensions: {
      correctness: "Correctness",
      depth: "Depth",
      problem_solving: "Problem solving",
      communication: "Communication",
      system_thinking: "System thinking",
    },
  },
  {
    id: "consulting_round",
    label: "Consulting Round",
    shortLabel: "Consulting",
    description: "Classic cases: structure, market sizing, profitability, market entry.",
    setupHint: "Paste case book excerpts or a full case prompt. Nothing is hardcoded.",
    promptLabel: "Case content / custom prompt",
    promptPlaceholder:
      "Paste a case (profitability, market entry, guesstimate) or excerpts from a case book.",
    icon: Briefcase,
    dimensions: {
      structuring: "Structuring",
      quant_rigor: "Quant rigor",
      communication: "Communication",
      synthesis: "Synthesis",
      business_judgment: "Business judgment",
    },
  },
];

export function getMode(id: string | undefined): ModeConfig | undefined {
  return MODES.find((mode) => mode.id === id);
}

export function isInterviewMode(value: string): value is InterviewMode {
  return MODE_IDS.includes(value as InterviewMode);
}
