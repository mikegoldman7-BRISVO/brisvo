/**
 * Minimal PostgREST client over `fetch`.
 *
 * The website talks to the same project through supabase-js, but the app only
 * needs anonymous reads plus a single enquiry insert, so a thin client keeps
 * the bundle small and avoids the URL/stream polyfills supabase-js expects in
 * React Native.
 */
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON ?? "";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON);

/** Surfaced in the UI so a missing .env is obvious instead of looking like a network fault. */
export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super(
      "Supabase is not configured. Copy .env.example to .env and set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON.",
    );
    this.name = "SupabaseNotConfiguredError";
  }
}

const REQUEST_TIMEOUT_MS = 15000;

function authHeaders(): Record<string, string> {
  return {
    apikey: SUPABASE_ANON,
    Authorization: `Bearer ${SUPABASE_ANON}`,
    "Content-Type": "application/json",
  };
}

async function request(path: string, init: RequestInit & { prefer?: string } = {}) {
  if (!isSupabaseConfigured) throw new SupabaseNotConfiguredError();

  const { prefer, headers, ...rest } = init;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      ...rest,
      signal: controller.signal,
      headers: {
        ...authHeaders(),
        Prefer: prefer ?? "return=representation",
        ...(headers as Record<string, string> | undefined),
      },
    });

    if (!response.ok) {
      throw new Error((await response.text()) || `Request failed (${response.status})`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("The request timed out. Check your connection and try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function selectRows<T>(path: string): Promise<T[]> {
  const data = await request(path);
  return Array.isArray(data) ? (data as T[]) : [];
}

export async function insertRow(table: string, body: unknown): Promise<void> {
  await request(table, {
    method: "POST",
    body: JSON.stringify(body),
    prefer: "return=minimal",
  });
}

/**
 * Calls a Supabase Edge Function, retrying because these cold-start —
 * the same allowance the website makes.
 */
export async function invokeFunction(name: string, body: unknown, retries = 2): Promise<unknown> {
  if (!isSupabaseConfigured) throw new SupabaseNotConfiguredError();

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error((await response.text()) || `Request failed (${response.status})`);
      }

      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1200 * (attempt + 1)));
      }
    }
  }

  throw lastError;
}
