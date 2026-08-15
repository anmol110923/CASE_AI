import Link from "next/link";
import { notFound } from "next/navigation";
import SessionSetupForm from "@/components/setup/SessionSetupForm";
import { getMode, isInterviewMode, toModeSetupProps } from "@/lib/modes";

export default async function ModeSetupPage({
  params,
}: {
  params: Promise<{ mode: string }>;
}) {
  const { mode: modeId } = await params;
  if (!isInterviewMode(modeId)) notFound();
  const mode = getMode(modeId);
  if (!mode) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/" className="text-sm text-zinc-600 hover:text-zinc-900">
        ← All modes
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{mode.label}</h1>
      <p className="mt-2 text-zinc-600">{mode.description}</p>
      <div className="mt-8">
        <SessionSetupForm mode={toModeSetupProps(mode)} />
      </div>
    </main>
  );
}
