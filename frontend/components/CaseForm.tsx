"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSession } from "@/lib/api";
import type { Difficulty, DurationMinutes, InterviewType } from "@/lib/types";

const TYPES: { value: InterviewType; label: string }[] = [
  { value: "product_management", label: "Product Management" },
  { value: "consulting", label: "Consulting" },
  { value: "general", label: "General Case" },
];

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const DURATIONS: DurationMinutes[] = [15, 30, 45];

export default function CaseForm() {
  const router = useRouter();
  const [casePrompt, setCasePrompt] = useState("");
  const [interviewType, setInterviewType] = useState<InterviewType>("product_management");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [duration, setDuration] = useState<DurationMinutes>(30);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (casePrompt.trim().length < 10) {
      setError("Enter a case prompt of at least 10 characters.");
      return;
    }
    setLoading(true);
    try {
      const session = await createSession({
        case_prompt: casePrompt.trim(),
        interview_type: interviewType,
        difficulty,
        duration_minutes: duration,
      });
      router.push(`/interview/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start interview.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Case prompt</span>
        <textarea
          value={casePrompt}
          onChange={(e) => setCasePrompt(e.target.value)}
          rows={6}
          placeholder='e.g. "Swiggy order frequency has dropped 15%. Diagnose the problem and recommend solutions."'
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-slate-500"
        />
      </label>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-slate-700">Interview type</legend>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setInterviewType(option.value)}
              className={`rounded-full border px-4 py-1.5 text-sm ${
                interviewType === option.value
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 bg-white text-slate-700"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-slate-700">Difficulty</legend>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setDifficulty(option)}
              className={`rounded-full border px-4 py-1.5 text-sm capitalize ${
                difficulty === option
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 bg-white text-slate-700"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-slate-700">Duration</legend>
        <div className="flex flex-wrap gap-2">
          {DURATIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setDuration(option)}
              className={`rounded-full border px-4 py-1.5 text-sm ${
                duration === option
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 bg-white text-slate-700"
              }`}
            >
              {option} min
            </button>
          ))}
        </div>
      </fieldset>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? "Starting interview…" : "Begin Interview"}
      </button>
    </form>
  );
}
