"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Turn } from "@/lib/types";

export default function ConversationHistory({ turns }: { turns: Turn[] }) {
  const [open, setOpen] = useState(false);

  if (turns.length === 0) {
    return <p className="text-sm text-zinc-500">No conversation yet.</p>;
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm font-medium text-zinc-800">
        Running transcript ({turns.length} turns)
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ol className="mt-3 max-h-72 space-y-3 overflow-y-auto pr-1">
          {turns.map((turn, index) => (
            <li
              key={`${turn.timestamp}-${index}`}
              className={`rounded-lg px-3 py-2 text-sm ${
                turn.role === "interviewer"
                  ? "bg-zinc-100 text-zinc-800"
                  : "border border-zinc-200 bg-white text-zinc-700"
              }`}
            >
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {turn.role === "interviewer" ? "Interviewer" : "You"}
              </p>
              <p className="whitespace-pre-wrap leading-relaxed">{turn.content}</p>
            </li>
          ))}
        </ol>
      </CollapsibleContent>
    </Collapsible>
  );
}
