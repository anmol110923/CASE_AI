import type { CreateSessionPayload, Session } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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

export function getSession(id: string): Promise<Session> {
  return request<Session>(`/sessions/${id}`);
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

export async function transcribeAudio(blob: Blob): Promise<string> {
  const form = new FormData();
  form.append("audio", blob, "answer.webm");
  const data = await request<{ transcript: string }>("/transcribe", {
    method: "POST",
    body: form,
  });
  return data.transcript;
}
