import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MODES } from "@/lib/modes";

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <div className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Personal practice
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
          Interview practice, five modes
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-zinc-600">
          You supply the content — case books, resume, JD, question lists. The interviewer adapts,
          you answer by voice, and you get a scored report at the end.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          return (
            <Link key={mode.id} href={`/modes/${mode.id}/setup`} className="group">
              <Card className="h-full transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-zinc-400 group-hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                  <CardTitle className="pt-3">{mode.label}</CardTitle>
                  <CardDescription>{mode.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                    Start setup
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
