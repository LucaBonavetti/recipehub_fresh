import { viewerHeaders } from './lib/auth';

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  const headers = new Headers(init?.headers || {});
  const v = viewerHeaders();
  Object.entries(v).forEach(([k, val]) => headers.set(k, String(val)));

  const res = await fetch(input, { ...init, headers });
  return res;
}
