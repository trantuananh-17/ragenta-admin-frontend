/**
 * Runtime configuration, not build-time. `EnvScript` serializes the allowlist
 * below into `window.__env` on every render, so one Docker image runs against
 * staging and production without being rebuilt.
 *
 * Only values a browser may see belong here. Backend URLs never do — the
 * browser reaches both backends through this app's own /api/* proxy.
 */
declare global {
  interface Window {
    __env?: {
      APP_BASE_URL?: string;
      SITE_BASE_URL?: string;
    };
  }
}

type PublicKey = keyof NonNullable<Window["__env"]>;

function runtimeEnv(key: PublicKey, fallback: string): string {
  if (typeof window !== "undefined") return window.__env?.[key] || fallback;
  return process.env[key] || fallback;
}

/** The customer app — where an invited member or a reset link lands. */
export const appBaseUrl = () =>
  runtimeEnv("APP_BASE_URL", "http://localhost:3001");

/** The marketing site — what the content screens publish to. */
export const siteBaseUrl = () =>
  runtimeEnv("SITE_BASE_URL", "http://localhost:3000");
