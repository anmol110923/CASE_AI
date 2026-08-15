"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ConversationHistory from "@/components/ConversationHistory";
import EvaluationReport from "@/components/EvaluationReport";
import InterviewTimer from "@/components/InterviewTimer";
import ProgressBar from "@/components/ProgressBar";
import QuestionDisplay from "@/components/QuestionDisplay";
import VoiceRecorder from "@/components/VoiceRecorder";
import { endInterview, getSession, submitTurn } from "@/lib/api";
import type { Session } from "@/lib/types";

export default function InterviewPage() {
  const params = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const endedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    getSession(params.id)
      .then((data) => {
        if (!cancelled) setSession(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load interview.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const handleEnd = useCallback(async () => {
    if (endedRef.current) return;
    endedRef.current = true;
    setEnding(true);
    setError(null);
    try {
      const updated = await endInterview(params.id);
      setSession(updated);
    } catch (err) {
      endedRef.current = false;
      setError(err instanceof Error ? err.message : "Could not end interview.");
    } finally {
      setEnding(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (!session || session.status !== "active") return;
    const started = new Date(session.created_at).getTime();
    const totalMs = session.duration_minutes * 60 * 1000;

    function tick() {
      const remaining = Math.max(0, Math.ceil((started + totalMs - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      if (remaining <= 0) {
        void handleEnd();
      }
    }

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [session, handleEnd]);

  async function handleSubmit(answer: string) {
    setSubmitting(true);
    setError(null);
    try {
      const updated = await submitTurn(params.id, answer);
      setSession(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit answer.");
    } finally {
      setSubmitting(false);
    }
  }

  if (error && !session) {
    return <p className="p-8 text-sm text-red-600">{error}</p>;
  }

  if (!session) {
    return <p className="p-8 text-sm text-slate-600">Loading interview…</p>;
  }

  const totalSeconds = session.duration_minutes * 60;
  const remaining = remainingSeconds ?? totalSeconds;
  const progress = 1 - remaining / totalSeconds;
  const isComplete = session.status === "complete" && session.evaluation;
  const isEvaluating = session.status === "evaluating" || ending;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Case interview</p>
          <InterviewTimer remainingSeconds={isComplete ? 0 : remaining} />
        </div>
        {!isComplete ? (
          <button
            type="button"
            onClick={handleEnd}
            disabled={ending}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700"
          >
            {ending ? "Ending…" : "End interview"}
          </button>
        ) : (
          <Link href="/setup" className="text-sm text-slate-700 underline">
            New interview
          </Link>
        )}
      </header>

      <ProgressBar progress={isComplete ? 1 : progress} />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {isEvaluating && !isComplete ? (
        <p className="text-sm text-slate-600">Generating evaluation…</p>
      ) : null}

      {isComplete && session.evaluation ? (
        <EvaluationReport evaluation={session.evaluation} />
      ) : (
        <>
          <QuestionDisplay question={session.current_question} />
          <section>
            <h2 className="mb-3 text-sm font-semibold text-slate-800">Conversation</h2>
            <ConversationHistory turns={session.turns} />
          </section>
          <VoiceRecorder
            disabled={session.status !== "active" || ending}
            submitting={submitting}
            onSubmit={handleSubmit}
          />
        </>
      )}
    </main>
  );
}
