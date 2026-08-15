import type { Turn } from "@/lib/types";

export default function ConversationHistory({ turns }: { turns: Turn[] }) {
  if (turns.length === 0) {
    return <p className="text-sm text-slate-500">No conversation yet.</p>;
  }

  return (
    <ol className="max-h-72 space-y-3 overflow-y-auto pr-1">
      {turns.map((turn, index) => (
        <li
          key={`${turn.timestamp}-${index}`}
          className={`rounded-lg px-3 py-2 text-sm ${
            turn.role === "interviewer"
              ? "bg-slate-100 text-slate-800"
              : "border border-slate-200 bg-white text-slate-700"
          }`}
        >
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {turn.role === "interviewer" ? "Interviewer" : "You"}
          </p>
          <p className="whitespace-pre-wrap leading-relaxed">{turn.content}</p>
        </li>
      ))}
    </ol>
  );
}
