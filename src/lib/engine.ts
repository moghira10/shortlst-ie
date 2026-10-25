// Thin client for the Shortlst interview engine — the same service asparagus
// uses. The browser never talks to the engine directly; everything is proxied
// through our API routes so ownership can be checked first.

export interface CreateSessionPayload {
  session_id: string;
  candidate_id: string;
  job_id: string;
  job_role: string;
  level: string;
  interview_type: string;
  job_description: string;
  candidate_name: string;
  candidate_resume: string;
  recruiter_id: string;
  callback_url: string;
  custom_questions: string[];
  interview_guidelines: string;
}

function engineUrl(): string | null {
  return process.env.INTERVIEW_ENGINE_URL ?? null;
}

export function engineConfigured(): boolean {
  return Boolean(engineUrl());
}

export async function createEngineSession(payload: CreateSessionPayload): Promise<Response> {
  const send = (body: CreateSessionPayload) => fetch(`${engineUrl()}/api/session/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.INTERVIEW_ENGINE_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const res = await send(payload);
  // Every asparagus caller sends level "mid". If this engine build doesn't
  // accept other levels yet, retry at mid rather than failing the session.
  if ((res.status === 400 || res.status === 422) && payload.level !== 'mid') {
    console.warn(`[engine] create rejected level "${payload.level}" (${res.status}) — retrying with "mid"`);
    return send({ ...payload, level: 'mid' });
  }
  return res;
}

/** Proxies join/start/end to the engine and returns the raw response. */
export async function engineSessionCall(sessionId: string, action: 'join' | 'start' | 'end'): Promise<Response> {
  return fetch(`${engineUrl()}/api/session/${encodeURIComponent(sessionId)}/${action}`, {
    method: action === 'join' ? 'GET' : 'POST',
  });
}
