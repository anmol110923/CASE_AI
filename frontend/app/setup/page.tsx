import CaseForm from "@/components/CaseForm";

export default function SetupPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">Set up your interview</h1>
      <p className="mt-2 mb-8 text-sm text-slate-600">
        Paste a case prompt, choose the interview style, then begin.
      </p>
      <CaseForm />
    </main>
  );
}
