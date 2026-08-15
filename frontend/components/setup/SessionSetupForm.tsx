"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createSession, createSessionWithResume } from "@/lib/api";
import type { ModeSetupProps } from "@/lib/modes";
import type { Difficulty, DurationMinutes } from "@/lib/types";
import { cn } from "@/lib/utils";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const DURATIONS: DurationMinutes[] = [15, 30, 45];

export default function SessionSetupForm({ mode }: { mode: ModeSetupProps }) {
  const router = useRouter();
  const [customPrompt, setCustomPrompt] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [duration, setDuration] = useState<DurationMinutes>(30);
  const [focusAreas, setFocusAreas] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isResume = mode.id === "resume_round";

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (customPrompt.trim().length < 10) {
      setError("Enter a custom prompt of at least 10 characters.");
      return;
    }
    const tags = focusAreas
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    setLoading(true);
    try {
      if (isResume && (resumeFile || resumeText.trim())) {
        const form = new FormData();
        form.append("custom_prompt", customPrompt.trim());
        form.append("difficulty", difficulty);
        form.append("duration_minutes", String(duration));
        form.append("focus_areas", tags.join(","));
        form.append("resume_text", resumeText.trim());
        if (resumeFile) form.append("resume_pdf", resumeFile);
        const session = await createSessionWithResume(form);
        router.push(`/interview/${session.id}`);
        return;
      }
      const session = await createSession({
        mode: mode.id,
        custom_prompt: customPrompt.trim(),
        difficulty,
        duration_minutes: duration,
        focus_areas: tags,
        resume_text: isResume ? resumeText.trim() || null : null,
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
        <span className="text-sm font-medium text-zinc-800">{mode.promptLabel}</span>
        <p className="text-sm text-zinc-500">{mode.setupHint}</p>
        <Textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          rows={10}
          placeholder={mode.promptPlaceholder}
        />
      </label>

      {isResume ? (
        <div className="space-y-4 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 p-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-800">Resume PDF (optional)</span>
            <p className="text-xs text-zinc-500">
              Text-based PDFs only. Scanned images will not extract.
            </p>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-sm file:text-white"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-800">Resume text (optional)</span>
            <Textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={6}
              placeholder="Paste resume text if you are not uploading a PDF."
            />
          </label>
        </div>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm font-medium text-zinc-800">Focus areas</span>
        <input
          value={focusAreas}
          onChange={(e) => setFocusAreas(e.target.value)}
          placeholder="Comma-separated tags, e.g. metrics, guesstimates"
          className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
        />
      </label>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-zinc-800">Difficulty</legend>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setDifficulty(option)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm capitalize",
                difficulty === option
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-300 bg-white text-zinc-700",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-zinc-800">Duration</legend>
        <div className="flex flex-wrap gap-2">
          {DURATIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setDuration(option)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm",
                duration === option
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-300 bg-white text-zinc-700",
              )}
            >
              {option} min
            </button>
          ))}
        </div>
      </fieldset>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" disabled={loading} className="w-full" size="lg">
        {loading ? "Starting interview…" : "Start Interview"}
      </Button>
    </form>
  );
}
