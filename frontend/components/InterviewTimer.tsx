"use client";

function formatTime(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = clamped % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  if (hours > 0) return `${String(hours).padStart(2, "0")}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

export default function InterviewTimer({ remainingSeconds }: { remainingSeconds: number }) {
  const urgent = remainingSeconds <= 60;
  return (
    <p className={`font-mono text-lg tabular-nums ${urgent ? "text-red-600" : "text-slate-900"}`}>
      {formatTime(remainingSeconds)}
    </p>
  );
}
