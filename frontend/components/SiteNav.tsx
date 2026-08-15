import Link from "next/link";

export default function SiteNav() {
  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-sm font-semibold tracking-tight text-zinc-900">
          CASE_AI
        </Link>
        <nav className="flex items-center gap-4 text-sm text-zinc-600">
          <Link href="/" className="hover:text-zinc-900">
            Practice
          </Link>
          <Link href="/history" className="hover:text-zinc-900">
            History
          </Link>
        </nav>
      </div>
    </header>
  );
}
