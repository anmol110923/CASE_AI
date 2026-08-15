import type { CreateSessionPayload, Session, SessionDebug, SessionSummary } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8005";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);
  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (typeof body.detail === "string") detail = body.detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return response.json() as Promise<T>;
}

export function createSession(payload: CreateSessionPayload): Promise<Session> {
  return request<Session>("/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function createSessionWithResume(form: FormData): Promise<Session> {
  return request<Session>("/sessions/with-resume", {
    method: "POST",
    body: form,
  });
}

export function listSessions(): Promise<SessionSummary[]> {
  return request<SessionSummary[]>("/sessions");
}

export function getSession(id: string): Promise<Session> {
  return request<Session>(`/sessions/${id}`);
}

export function getSessionDebug(id: string): Promise<SessionDebug> {
  return request<SessionDebug>(`/sessions/${id}/debug`);
}

export function submitTurn(id: string, answer: string): Promise<Session> {
  return request<Session>(`/sessions/${id}/turns`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answer }),
  });
}

export function endInterview(id: string): Promise<Session> {
  return request<Session>(`/sessions/${id}/end`, { method: "POST" });
}

function audioFilename(blob: Blob): string {
  if (blob.type.includes("mp4")) return "answer.mp4";
  if (blob.type.includes("ogg")) return "answer.ogg";
  return "answer.webm";
}

export async function transcribeAudio(blob: Blob): Promise<string> {
  const form = new FormData();
  form.append("audio", blob, audioFilename(blob));
  const data = await request<{ transcript: string }>("/transcribe", {
    method: "POST",
    body: form,
  });
  return data.transcript;
}
