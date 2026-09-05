import ky from "ky";

import { RAGENTA_CONTENT_API_URL, forwardedCookie } from "./server-fetch";

/**
 * `ragenta-content-backend` — everything the marketing site renders.
 *
 * It has no user store: its admin routes introspect the same Better Auth
 * session against `ragenta-backend`, so the credential this client forwards is
 * the very same cookie `api` uses.
 */
function baseUrl() {
  return typeof window === "undefined"
    ? `${RAGENTA_CONTENT_API_URL}/v1`
    : "/api/content";
}

export const contentApi = ky.create({
  prefixUrl: baseUrl(),
  retry: 0,
  hooks: {
    beforeRequest: [
      async (request) => {
        if (typeof window !== "undefined") return;
        const cookie = await forwardedCookie();
        if (cookie) request.headers.set("cookie", cookie);
      },
    ],
    afterResponse: [
      async (_request, _options, response) => {
        if (response.status === 401 && typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return response;
      },
    ],
  },
});
