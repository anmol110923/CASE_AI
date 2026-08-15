"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import ConversationHistory from "@/components/ConversationHistory";
import DebugPanel from "@/components/DebugPanel";
import EvaluationReport from "@/components/EvaluationReport";
import InterviewTimer from "@/components/InterviewTimer";
import ProgressBar from "@/components/ProgressBar";
import QuestionDisplay from "@/components/QuestionDisplay";
import VoiceRecorder from "@/components/VoiceRecorder";
import { Button } from "@/components/ui/button";
import { useInterviewSession } from "@/hooks/useInterviewSession";
import { getMode } from "@/lib/modes";

const SHOW_DEBUG = process.env.NEXT_PUBLIC_DEBUG === "true";

export default function InterviewPage() {
  const params = useParams<{ id: string }>();
  const { session, error, submitting, ending, remainingSeconds, handleEnd, handleSubmit } =
    useInterviewSession(params.id);

  if (error && !session) {
    return <p className="p-8 text-sm text-red-600">{error}</p>;
  }

  if (!session) {
    return <p className="p-8 text-sm text-zinc-600">Loading interview…</p>;
  }

  const mode = getMode(session.mode);
  const totalSeconds = session.duration_minutes * 60;
  const remaining = remainingSeconds ?? totalSeconds;
  const progress = 1 - remaining / totalSeconds;
  const isComplete = session.status === "complete" && session.evaluation;
  const isEvaluating = session.status === "evaluating" || ending;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-52px)] max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {mode?.label ?? session.mode}
          </p>
          <InterviewTimer remainingSeconds={isComplete ? 0 : remaining} />
        </div>
        {!isComplete ? (
          <Button type="button" variant="outline" size="sm" onClick={handleEnd} disabled={ending}>
            {ending ? "Ending…" : "End interview"}
          </Button>
        ) : (
          <Link href="/" className="text-sm text-zinc-700 underline">
            New interview
          </Link>
        )}
      </header>

      <ProgressBar progress={isComplete ? 1 : progress} />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {isEvaluating && !isComplete ? (
        <p className="text-sm text-zinc-600">Generating evaluation…</p>
      ) : null}

      {isComplete && session.evaluation ? (
        <EvaluationReport session={session} />
      ) : (
        <>
          <QuestionDisplay question={session.current_question} />
          <ConversationHistory turns={session.turns} />
          <VoiceRecorder
            disabled={session.status !== "active" || ending}
            submitting={submitting}
            onSubmit={handleSubmit}
          />
        </>
      )}

      {SHOW_DEBUG ? <DebugPanel sessionId={session.id} /> : null}
    </main>
  );
}
