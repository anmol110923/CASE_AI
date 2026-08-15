export default function ProgressBar({ progress }: { progress: number }) {
  const width = Math.min(100, Math.max(0, progress * 100));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
      <div className="h-full bg-slate-800 transition-all" style={{ width: `${width}%` }} />
    </div>
  );
}
