"use client";

import { Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QuestionDisplay({
  question,
  autoSpeak,
  onAutoSpeakChange,
  isSpeaking,
  speechSupported,
  onListen,
  onStop,
}: {
  question: string | null;
  autoSpeak: boolean;
  onAutoSpeakChange: (value: boolean) => void;
  isSpeaking: boolean;
  speechSupported: boolean;
  onListen: () => void;
  onStop: () => void;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Current question
        </p>
        {speechSupported ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onListen} disabled={!question}>
              <Volume2 className="h-3.5 w-3.5" />
              {isSpeaking ? "Replay" : "Listen"}
            </Button>
            {isSpeaking ? (
              <Button type="button" variant="outline" size="sm" onClick={onStop}>
                <Square className="h-3.5 w-3.5" />
                Stop
              </Button>
            ) : null}
            <label className="flex items-center gap-2 text-xs text-zinc-600">
              <input
                type="checkbox"
                checked={autoSpeak}
                onChange={(event) => onAutoSpeakChange(event.target.checked)}
                className="h-3.5 w-3.5 rounded border-zinc-300"
              />
              Auto-read questions
            </label>
          </div>
        ) : (
          <p className="text-xs text-zinc-500">Speech is not supported in this browser.</p>
        )}
      </div>
      <p className="text-xl leading-relaxed text-zinc-900">
        {question ?? "Waiting for the interviewer…"}
      </p>
      {speechSupported ? (
        <p className="mt-3 text-xs text-zinc-500">
          {isSpeaking ? "Speaking…" : autoSpeak ? "Auto-read on" : "Auto-read off"}
        </p>
      ) : null}
    </section>
  );
}
