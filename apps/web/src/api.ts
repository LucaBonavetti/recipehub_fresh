export async function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  const res = await fetch(input, {
    ...init,
    credentials: 'include', // send/receive httpOnly cookies
  });
  return res;
}
