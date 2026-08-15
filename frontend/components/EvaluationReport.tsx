"use client";

import { useState } from "react";
import { ChevronDown, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getMode } from "@/lib/modes";
import type { Evaluation, Session } from "@/lib/types";

function ListSection({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-zinc-900">{title}</h3>
      <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function evaluationMarkdown(session: Session, evaluation: Evaluation): string {
  const mode = getMode(session.mode);
  const dims = Object.entries(evaluation.dimensions)
    .map(([key, value]) => {
      const label = mode?.dimensions[key] ?? key;
      return `### ${label}: ${value.score}/10\n${value.explanation}`;
    })
    .join("\n\n");
  const transcript = session.turns
    .map((turn) => `**${turn.role === "interviewer" ? "Interviewer" : "You"}:** ${turn.content}`)
    .join("\n\n");
  return `# ${mode?.label ?? session.mode} evaluation

Overall: ${evaluation.overall_score}/100

${evaluation.final_recommendation}

${dims}

## Transcript

${transcript}
`;
}

function download(filename: string, contents: string, type: string) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function EvaluationReport({ session }: { session: Session }) {
  const evaluation = session.evaluation;
  const [open, setOpen] = useState(false);
  if (!evaluation) return null;
  const mode = getMode(session.mode);

  return (
    <div className="space-y-8">
      <header className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Overall score
            </p>
            <p className="mt-1 text-4xl font-semibold text-zinc-900">{evaluation.overall_score}</p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                download(
                  `interview-${session.id}.md`,
                  evaluationMarkdown(session, evaluation),
                  "text/markdown",
                )
              }
            >
              <Download className="h-3.5 w-3.5" />
              Markdown
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                download(
                  `interview-${session.id}.json`,
                  JSON.stringify({ session, evaluation }, null, 2),
                  "application/json",
                )
              }
            >
              <Download className="h-3.5 w-3.5" />
              JSON
            </Button>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-zinc-700">{evaluation.final_recommendation}</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        {Object.entries(evaluation.dimensions).map(([key, value]) => (
          <article key={key} className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-zinc-900">
                {mode?.dimensions[key] ?? key}
              </h3>
              <span className="font-mono text-sm text-zinc-700">{value.score}/10</span>
            </div>
            <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full bg-zinc-900"
                style={{ width: `${Math.min(100, Math.max(0, value.score * 10))}%` }}
              />
            </div>
            <p className="text-sm leading-relaxed text-zinc-600">{value.explanation}</p>
          </article>
        ))}
      </section>

      <div className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6">
        <ListSection title="Strongest areas" items={evaluation.strongest_areas} />
        <ListSection title="Weakest areas" items={evaluation.weakest_areas} />
        <ListSection title="Specific mistakes" items={evaluation.specific_mistakes} />
        <ListSection title="Missed opportunities" items={evaluation.missed_opportunities} />
        <ListSection title="Questions where you struggled" items={evaluation.struggled_questions} />
        <ListSection title="Recommended areas to practice" items={evaluation.practice_recommendations} />
      </div>

      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm font-medium">
          Full transcript
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ol className="mt-3 space-y-3">
            {session.turns.map((turn, index) => (
              <li key={`${turn.timestamp}-${index}`} className="text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {turn.role === "interviewer" ? "Interviewer" : "You"}
                </p>
                <p className="whitespace-pre-wrap text-zinc-700">{turn.content}</p>
              </li>
            ))}
          </ol>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
