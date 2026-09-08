import { z } from "zod";

import { api } from "@/lib/ky";

/**
 * `GET /v1/admin/provider-errors` — provider calls that failed, and how often
 * each kind is failing.
 *
 * **Failures only.** A row per successful call would grow with traffic and
 * duplicate the usage ledger; this table grows with what is wrong, which is the
 * property that keeps it readable (ADR-063). So an empty screen here is the
 * healthy state, and the screen says so rather than looking broken.
 */
export const providerErrorSchema = z.object({
  id: z.string(),
  /** Null for a call with no workspace behind it — a platform check, say. */
  organizationId: z.string().nullable(),
  provider: z.string(),
  model: z.string().nullable(),
  operation: z.string(),
  /** Null for a timeout or a socket error, where there was no HTTP status. */
  status: z.number().nullable(),
  message: z.string(),
  durationMs: z.number().nullable(),
  createdAt: z.coerce.string(),
});

export type ProviderError = z.infer<typeof providerErrorSchema>;

/** One provider + operation + status, counted over the range. */
export const errorSummarySchema = z.object({
  provider: z.string(),
  operation: z.string(),
  status: z.number().nullable(),
  failures: z.number(),
  lastAt: z.string(),
});

export type ErrorSummary = z.infer<typeof errorSummarySchema>;

export const providerErrorsSchema = z.object({
  range: z.object({ from: z.string(), to: z.string() }),
  errors: z.array(providerErrorSchema),
  summary: z.array(errorSummarySchema),
});

export type ProviderErrors = z.infer<typeof providerErrorsSchema>;

export interface ProviderErrorsParams {
  days: number;
}

export async function getProviderErrors(
  params: ProviderErrorsParams,
): Promise<ProviderErrors> {
  const response = await api.get("admin/provider-errors", {
    searchParams: { from: daysAgo(params.days) },
  });
  return providerErrorsSchema.parse(await response.json());
}

/** `YYYY-MM-DD`, in UTC — the same calendar the backend reads the range in. */
function daysAgo(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

/**
 * What a status usually means to whoever is reading this.
 *
 * Deliberately about the *action*, not the RFC: an admin looking at a wall of
 * 429s needs to know it is a rate limit they can raise, not what "Too Many
 * Requests" expands to.
 */
export function explainStatus(status: number | null): string {
  if (status === null) return "No response — a timeout or a dropped connection.";
  if (status === 401 || status === 403) return "The key was refused. Check it is still valid.";
  if (status === 404) return "The model or endpoint does not exist for this key.";
  if (status === 429) return "Rate limited or out of quota at the provider.";
  if (status === 402) return "Billing at the provider.";
  if (status >= 500) return "The provider's own failure. Usually transient.";
  if (status === 400 || status === 422) return "The request was rejected — often a bad model name or too long an input.";
  return "";
}
