"use client";

import { useEffect, useRef, useState } from "react";
import { transcribeAudio } from "@/lib/api";

type RecorderState = "idle" | "recording" | "transcribing" | "ready";

function preferredRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

export default function VoiceRecorder({
  disabled,
  submitting,
  onRecordingStart,
  onSubmit,
}: {
  disabled: boolean;
  submitting: boolean;
  onRecordingStart?: () => void;
  onSubmit: (transcript: string) => Promise<void>;
}) {
  const [state, setState] = useState<RecorderState>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startRecording() {
    setError(null);
    onRecordingStart?.();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = preferredRecorderMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setState("transcribing");
        try {
          const text = await transcribeAudio(blob);
          setTranscript(text);
          setState("ready");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Transcription failed.");
          setState("idle");
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setElapsed(0);
      timerRef.current = window.setInterval(() => setElapsed((value) => value + 1), 1000);
      setState("recording");
    } catch {
      setError("Microphone access is required to record an answer.");
    }
  }

  function stopRecording() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    mediaRecorderRef.current?.stop();
  }

  async function handleSubmit() {
    const text = transcript.trim();
    if (!text) {
      setError("Transcript is empty. Record again, or type your answer in the box above.");
      return;
    }
    await onSubmit(text);
    setTranscript("");
    setState("idle");
    setElapsed(0);
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center gap-3">
        {state !== "recording" ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={disabled || submitting || state === "transcribing"}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Record
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white"
          >
            Stop
          </button>
        )}
        <p className="text-sm text-slate-600">
          {state === "idle" && "Ready to record"}
          {state === "recording" && `Recording… ${String(elapsed).padStart(2, "0")}s`}
          {state === "transcribing" && "Transcribing…"}
          {state === "ready" && "Review transcript, then submit"}
        </p>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Transcribed answer</span>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={5}
          disabled={disabled || state === "recording" || state === "transcribing"}
          placeholder="Your spoken answer will appear here. You can edit it before submitting."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 disabled:bg-slate-50"
        />
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={disabled || submitting || !transcript.trim()}
        className="rounded-lg border border-slate-900 px-4 py-2 text-sm font-medium text-slate-900 disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit answer"}
      </button>
    </div>
  );
}
