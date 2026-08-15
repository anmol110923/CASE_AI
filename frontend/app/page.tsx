import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Personal practice</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">
        Case Interview Platform
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-600">
        Enter any case prompt. A demanding AI interviewer will run an adaptive interview,
        then score your performance. You speak; questions appear as text.
      </p>
      <Link
        href="/setup"
        className="mt-10 inline-flex w-fit rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white"
      >
        Start Interview
      </Link>
    </main>
  );
}
