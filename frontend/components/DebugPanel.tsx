"use client";

import { useEffect, useState } from "react";
import { getSessionDebug } from "@/lib/api";
import type { SessionDebug } from "@/lib/types";

export default function DebugPanel({ sessionId }: { sessionId: string }) {
  const [data, setData] = useState<SessionDebug | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    function load() {
      getSessionDebug(sessionId)
        .then((payload) => {
          if (!cancelled) setData(payload);
        })
        .catch((err) => {
          if (!cancelled) setError(err instanceof Error ? err.message : "Debug unavailable");
        });
    }
    load();
    const id = window.setInterval(load, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [sessionId]);

  if (error) {
    return (
      <aside className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
        Debug panel: {error}
      </aside>
    );
  }

  if (!data) return null;

  return (
    <aside className="rounded-xl border border-zinc-200 bg-zinc-950 p-4 font-mono text-xs text-zinc-200">
      <p className="mb-2 font-sans text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
        Token / context debug
      </p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
        <dt>messages</dt>
        <dd>{data.message_count}</dd>
        <dt>exchanges</dt>
        <dd>{data.exchange_count}</dd>
        <dt>window</dt>
        <dd>{data.window_exchanges}</dd>
        <dt>recent turns</dt>
        <dd>{data.recent_turn_count}</dd>
        <dt>summary chars</dt>
        <dd>{data.summary_length}</dd>
        <dt>session tokens</dt>
        <dd>{data.token_usage.session_total}</dd>
      </dl>
      <p className="mt-3 text-[11px] text-zinc-500">
        interviewer {data.interviewer_model} · eval {data.eval_model}
      </p>
      {data.token_usage.calls.length > 0 ? (
        <ol className="mt-2 max-h-28 space-y-0.5 overflow-y-auto text-[11px] text-zinc-400">
          {data.token_usage.calls.map((call, index) => (
            <li key={`${call.type}-${index}`}>
              {call.type}: p{call.prompt} o{call.output} t{call.total}
            </li>
          ))}
        </ol>
      ) : null}
    </aside>
  );
}
