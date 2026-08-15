export default function QuestionDisplay({ question }: { question: string | null }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Current question
      </p>
      <p className="text-xl leading-relaxed text-zinc-900">
        {question ?? "Waiting for the interviewer…"}
      </p>
    </section>
  );
}
