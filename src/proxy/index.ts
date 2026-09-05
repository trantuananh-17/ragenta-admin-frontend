import { Hono } from "hono";
import type { Context } from "hono";
import { proxy } from "hono/proxy";

import { RAGENTA_API_URL, RAGENTA_CONTENT_API_URL } from "@/lib/server-fetch";
import { authProxy } from "./auth";

/**
 * The server-side API surface the browser talks to.
 *
 * Every backend call from a client component goes through here rather than
 * straight to a backend, for two reasons: the backend URLs stay out of the
 * bundle, and the request stays same-origin so the browser attaches the
 * httpOnly session cookie without any CORS arrangement.
 *
 * There is no token to mint. Both backends authenticate the Better Auth session
 * cookie itself, so this proxy forwards the credential and adds nothing.
 */
const app = new Hono();

/** Refuses a misconfiguration that would make this app proxy to itself. */
function isSelfReference(target: string, host: string | undefined) {
  if (!host) return false;
  try {
    return new URL(target).host === host;
  } catch {
    return false;
  }
}

async function forward(c: Context, target: string, label: string) {
  const host = c.req.header("host");

  if (isSelfReference(target, host)) {
    return c.json(
      {
        error: {
          code: "PROXY_MISCONFIGURED",
          message: `${label} points back at the admin frontend.`,
        },
      },
      500,
    );
  }

  try {
    return await proxy(target, {
      ...c.req,
      headers: {
        ...c.req.header(),
        "X-Forwarded-Host": host ?? "",
      },
    });
  } catch (error) {
    return c.json(
      {
        error: {
          code: "PROXY_FAILED",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      },
      502,
    );
  }
}

// Mounted before the routes below so it claims its prefix first.
app.route("/api/auth", authProxy);

/** This app's own liveness, for the container healthcheck. Reaches no backend. */
app.get("/api/health", (c) => c.json({ status: "ok" }));

// ragenta-content-backend — the marketing site's content.
app.all("/api/content/*", (c) => {
  const url = new URL(c.req.url);
  const path = url.pathname.replace(/^\/api\/content\/?/, "");
  return forward(
    c,
    `${RAGENTA_CONTENT_API_URL}/v1/${path}${url.search}`,
    "RAGENTA_CONTENT_API_URL",
  );
});

// ragenta-backend — everything else. The `/v1` segment is kept in the path so
// the proxy is a rewrite of the host only, and a route reads the same here as it
// does in the backend's own router.
app.all("/api/v1/*", (c) => {
  const url = new URL(c.req.url);
  const path = url.pathname.replace(/^\/api\/v1\/?/, "");
  return forward(c, `${RAGENTA_API_URL}/v1/${path}${url.search}`, "RAGENTA_API_URL");
});

export default app;
