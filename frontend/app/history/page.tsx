"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { listSessions } from "@/lib/api";
import { getMode } from "@/lib/modes";
import type { SessionSummary } from "@/lib/types";

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listSessions()
      .then(setSessions)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load history."));
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">History</h1>
      <p className="mt-2 text-sm text-zinc-600">Past sessions persist across backend restarts.</p>

      {error ? <p className="mt-6 text-sm text-red-600">{error}</p> : null}
      {!sessions && !error ? <p className="mt-6 text-sm text-zinc-600">Loading…</p> : null}

      {sessions?.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-600">No sessions yet.</p>
      ) : null}

      <ul className="mt-8 space-y-3">
        {sessions?.map((item) => {
          const mode = getMode(item.mode);
          const date = new Date(item.created_at).toLocaleString();
          return (
            <li key={item.id}>
              <Link
                href={`/interview/${item.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-4 hover:border-zinc-400"
              >
                <div>
                  <p className="font-medium text-zinc-900">{mode?.label ?? item.mode}</p>
                  <p className="text-xs text-zinc-500">{date}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{item.duration_minutes} min</Badge>
                  <Badge className="capitalize">{item.difficulty}</Badge>
                  <Badge>{item.status}</Badge>
                  {item.overall_score != null ? (
                    <span className="font-mono text-sm text-zinc-800">{item.overall_score}</span>
                  ) : null}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
