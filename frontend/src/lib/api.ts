import { NEXT_PUBLIC_API_BASE_URL } from "@/lib/constants";

const BASE_URL = `${NEXT_PUBLIC_API_BASE_URL}/api`;

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("access") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await apiFetch(path);
  if (!res.ok) {
    throw Object.assign(new Error(`GET ${path} failed`), { status: res.status });
  }
  return res.json() as Promise<T>;
}

export async function apiPatch(path: string, body: unknown): Promise<Response> {
  return apiFetch(path, { method: "PATCH", body: JSON.stringify(body) });
}

export async function apiPost(path: string, body: unknown): Promise<Response> {
  return apiFetch(path, { method: "POST", body: JSON.stringify(body) });
}

export async function apiDelete(path: string): Promise<void> {
  await apiFetch(path, { method: "DELETE" });
}
