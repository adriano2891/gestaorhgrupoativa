/**
 * Centralized REST client for Supabase API calls
 * Eliminates duplicated REST helpers across hooks
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const getAccessToken = (): string | null => {
  try {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || SUPABASE_URL?.match(/\/\/([^.]+)/)?.[1];
    const raw = localStorage.getItem(`sb-${projectId}-auth-token`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.access_token || null;
    }
  } catch {}
  return null;
};

export const getUserIdFromToken = (): string | null => {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || null;
  } catch {
    return null;
  }
};

const getHeaders = () => {
  const token = getAccessToken();
  return {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${token || SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
  };
};

export const restGet = async (path: string) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`REST GET ${res.status}`);
  return res.json();
};

export const restPost = async (path: string, body: any) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'POST',
    headers: { ...getHeaders(), 'Prefer': 'return=representation' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`REST POST ${res.status}: ${text}`);
  }
  return res.json();
};

export const restPatch = async (path: string, body: any) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: { ...getHeaders(), 'Prefer': 'return=representation' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`REST PATCH ${res.status}: ${text}`);
  }
  return res.json();
};

export const restDelete = async (path: string) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'DELETE',
    headers: { ...getHeaders(), 'Prefer': 'return=representation' },
  });
  if (!res.ok) throw new Error(`REST DELETE ${res.status}`);
  return res.json();
};
