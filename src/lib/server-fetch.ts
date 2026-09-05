/**
 * Server-context helpers for reaching the two backends.
 *
 * `next/headers` is imported dynamically, never at the top of the module: the
 * ky clients below import this file and are themselves imported from client
 * components, and a static import would pull a server-only module into the
 * browser bundle.
 */

/** Backend base URLs. Server-side only — see `config.ts` for what the browser sees. */
export const RAGENTA_API_URL = (
  process.env.RAGENTA_API_URL || "http://localhost:8080"
).replace(/\/$/, "");

export const RAGENTA_CONTENT_API_URL = (
  process.env.RAGENTA_CONTENT_API_URL || "http://localhost:8084"
).replace(/\/$/, "");

/**
 * The caller's own credential, replayed upstream.
 *
 * Both backends authenticate the Better Auth session cookie directly — there is
 * no token to exchange, so a server-side call carries the browser's cookie and
 * nothing else. Never mint or cache a credential here: a stale one would
 * outlive the session it came from.
 */
export async function forwardedCookie(): Promise<string | undefined> {
  if (typeof window !== "undefined") return undefined;
  try {
    const { cookies } = await import("next/headers");
    const all = (await cookies()).getAll();
    if (all.length === 0) return undefined;
    return all.map((entry) => `${entry.name}=${entry.value}`).join("; ");
  } catch {
    // Outside a request scope (a build-time render, say) there is no caller.
    return undefined;
  }
}

/** Header options for a server-context Better Auth SDK call. */
export async function serverFetchOptions(): Promise<
  { headers: { cookie: string } } | undefined
> {
  const cookie = await forwardedCookie();
  return cookie ? { headers: { cookie } } : undefined;
}
