import { getToken } from '@/lib/storage';

// Override for local testing by running: EXPO_PUBLIC_API_URL="http://<your-lan-ip>/hbox/public/?route=api/" npx expo start
const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://secure.hboxdigital.com/public/?route=api/';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

async function request<T>(endpoint: string, options: RequestInit = {}, auth = true): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json', ...(options.headers as Record<string, string>) };

  if (auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(BASE + endpoint, { ...options, headers });
  } catch {
    throw new ApiError('Network error — check your connection', 0);
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new ApiError('Invalid server response', res.status);
  }

  if (res.status === 401) {
    onUnauthorized?.();
    throw new ApiError(data.error || 'Session expired — please sign in again', 401);
  }

  if (!data.ok) {
    throw new ApiError(data.error || 'Request failed', res.status);
  }

  return data as T;
}

export function apiGet<T>(endpoint: string, params: Record<string, string | number | undefined> = {}, auth = true): Promise<T> {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  const sep = endpoint.includes('&') || qs ? '&' : '';
  return request<T>(`${endpoint}${qs ? sep + qs : ''}`, { method: 'GET' }, auth);
}

export function apiPostJson<T>(endpoint: string, body: Record<string, unknown>, auth = true): Promise<T> {
  return request<T>(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, auth);
}

export function apiPostForm<T>(endpoint: string, form: FormData): Promise<T> {
  return request<T>(endpoint, { method: 'POST', body: form }, true);
}
