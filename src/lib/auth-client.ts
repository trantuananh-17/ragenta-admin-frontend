"use client";

import { createAuthClient } from "better-auth/react";
import { adminClient, organizationClient } from "better-auth/client/plugins";

/**
 * Better Auth's own surface: sign-in, sign-out, password reset, and the admin
 * and organization plugin operations `ragenta-backend` mounts.
 *
 * Ragenta's own admin API is plain REST and goes through `lib/ky.ts` instead —
 * product endpoints deliberately do not live inside auth plugins.
 *
 * Dual-mode: in the browser it calls `/api/auth`, same-origin, so the session
 * cookie is attached automatically and the proxy forwards it upstream.
 */
export const authClient = createAuthClient({
  baseURL:
    typeof window === "undefined"
      ? process.env.RAGENTA_API_URL || "http://localhost:8080"
      : "",
  basePath: typeof window === "undefined" ? "/v1/auth" : "/api/auth",
  plugins: [adminClient(), organizationClient()],
});
