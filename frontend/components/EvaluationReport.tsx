import type { Evaluation } from "@/lib/types";

const DIMENSION_LABELS: Record<string, string> = {
  problem_framing: "Problem framing",
  structure: "Structure",
  analytical_reasoning: "Analytical reasoning",
  business_judgment: "Business judgment",
  metrics: "Metrics",
  segmentation: "Segmentation",
  prioritization: "Prioritization",
  creativity: "Creativity",
  communication: "Communication",
  depth_of_reasoning: "Depth of reasoning",
  handling_challenges: "Ability to respond to challenges",
};

function ListSection({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-slate-900">{title}</h3>
      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default function EvaluationReport({ evaluation }: { evaluation: Evaluation }) {
  return (
    <div className="space-y-8">
      <header className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Overall score</p>
        <p className="mt-1 text-4xl font-semibold text-slate-900">{evaluation.overall_score}</p>
        <p className="mt-4 text-sm leading-relaxed text-slate-700">{evaluation.final_recommendation}</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        {Object.entries(evaluation.dimensions).map(([key, value]) => (
          <article key={key} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                {DIMENSION_LABELS[key] ?? key}
              </h3>
              <span className="font-mono text-sm text-slate-700">{value.score}/10</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">{value.explanation}</p>
          </article>
        ))}
      </section>

      <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
        <ListSection title="Strongest areas" items={evaluation.strongest_areas} />
        <ListSection title="Weakest areas" items={evaluation.weakest_areas} />
        <ListSection title="Specific mistakes" items={evaluation.specific_mistakes} />
        <ListSection title="Missed opportunities" items={evaluation.missed_opportunities} />
        <ListSection title="Questions where you struggled" items={evaluation.struggled_questions} />
        <ListSection title="Recommended areas to practice" items={evaluation.practice_recommendations} />
      </div>
    </div>
  );
}
