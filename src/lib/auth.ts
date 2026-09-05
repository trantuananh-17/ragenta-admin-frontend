import { cache } from "react";
import { redirect } from "next/navigation";

import { RAGENTA_API_URL, forwardedCookie } from "./server-fetch";

/**
 * The server-side session gate.
 *
 * `ragenta-backend` is the only source of identity, so this asks it rather than
 * decoding anything locally — a revoked session stops working here the moment it
 * stops working there. Everything below is UX: the backend re-checks the admin
 * flag on every one of its own admin routes, and is what actually enforces it.
 */
const SESSION_PATH = "/v1/auth/get-session";

/**
 * Mirrors `ADMIN_USER_IDS` on both backends. A platform owner who is an admin by
 * id rather than by role would otherwise pass every backend check and still be
 * bounced off the login page by this guard.
 */
const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

export interface AdminUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role?: string | null;
  banned?: boolean | null;
}

export interface AdminSession {
  user: AdminUser;
}

/** Wrapped in `cache` so one render asks the backend once. */
export const getSession = cache(async (): Promise<AdminSession | null> => {
  const cookie = await forwardedCookie();
  if (!cookie) return null;

  try {
    const response = await fetch(`${RAGENTA_API_URL}${SESSION_PATH}`, {
      headers: { cookie, accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;

    // Better Auth answers 200 with a literal `null` body for an anonymous caller.
    const body = (await response.json()) as AdminSession | null;
    if (!body?.user || body.user.banned) return null;
    return body;
  } catch {
    // An identity service we cannot reach is not an authenticated caller.
    return null;
  }
});

/** Better Auth's admin plugin stores roles as one comma-separated string. */
export function isPlatformAdmin(user: AdminUser): boolean {
  if (ADMIN_USER_IDS.includes(user.id)) return true;
  return (user.role ?? "")
    .split(",")
    .map((role) => role.trim())
    .includes("admin");
}

/** Every admin page starts with this. */
export async function requireAuth(): Promise<AdminSession> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isPlatformAdmin(session.user)) redirect("/login?reason=not-admin");
  return session;
}

/** Keeps a signed-in admin off the auth pages. */
export async function requireUnAuth(): Promise<void> {
  const session = await getSession();
  if (session && isPlatformAdmin(session.user)) redirect("/admin");
}
