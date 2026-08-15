"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { endInterview, getSession, submitTurn } from "@/lib/api";
import type { Session } from "@/lib/types";

export function useInterviewSession(id: string) {
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const endedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    getSession(id)
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
  }, [id]);

  useEffect(() => {
    if (!session || session.status !== "evaluating") return;
    const timer = window.setInterval(() => {
      getSession(id)
        .then(setSession)
        .catch(() => undefined);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [id, session]);

  const handleEnd = useCallback(async () => {
    if (endedRef.current) return;
    endedRef.current = true;
    setEnding(true);
    setError(null);
    try {
      const updated = await endInterview(id);
      setSession(updated);
    } catch (err) {
      endedRef.current = false;
      setError(err instanceof Error ? err.message : "Could not end interview.");
    } finally {
      setEnding(false);
    }
  }, [id]);

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
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [session, handleEnd]);

  async function handleSubmit(answer: string) {
    setSubmitting(true);
    setError(null);
    try {
      const updated = await submitTurn(id, answer);
      setSession(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit answer.");
    } finally {
      setSubmitting(false);
    }
  }

  return {
    session,
    error,
    submitting,
    ending,
    remainingSeconds,
    handleEnd,
    handleSubmit,
  };
}
