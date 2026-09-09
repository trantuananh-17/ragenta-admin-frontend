import { z } from "zod";

import { api } from "@/lib/ky";

/**
 * `GET /v1/admin/usage` — what the platform has spent, across every workspace.
 *
 * **Tokens and credits are different numbers.** Tokens are what the provider
 * counted; credits are what the customer was charged, priced at write time with
 * a margin between them. They travel separately all the way here so no cell can
 * quietly show one under the other's label.
 *
 * Both arrive as strings: credits are `numeric` in Postgres and exact, token
 * sums are `bigint`. Parsing either into a JavaScript number would be lossy at
 * the sizes this table reaches, so formatting happens at the last moment.
 */
const countsSchema = {
  calls: z.number(),
  inputTokens: z.string(),
  outputTokens: z.string(),
  embeddingTokens: z.string(),
  credits: z.string(),
  /** What the providers charged us over the same rows, frozen per call. */
  costUsd: z.string(),
};

export const modelUsageSchema = z.object({
  provider: z.string(),
  model: z.string(),
  workspaces: z.number(),
  ...countsSchema,
});

export const operationUsageSchema = z.object({ operation: z.string(), ...countsSchema });

export const workspaceUsageSchema = z.object({
  workspaceId: z.string(),
  name: z.string(),
  ...countsSchema,
});

export const dailyUsageSchema = z.object({ day: z.string(), ...countsSchema });

export const platformUsageSchema = z.object({
  range: z.object({ from: z.string(), to: z.string() }),
  totals: z
    .object({ workspaces: z.number(), models: z.number(), ...countsSchema })
    .nullish(),
  models: z.array(modelUsageSchema),
  operations: z.array(operationUsageSchema),
  workspaces: z.array(workspaceUsageSchema),
  daily: z.array(dailyUsageSchema),
});

export type ModelUsage = z.infer<typeof modelUsageSchema>;
export type WorkspaceUsage = z.infer<typeof workspaceUsageSchema>;
export type DailyUsage = z.infer<typeof dailyUsageSchema>;
export type PlatformUsage = z.infer<typeof platformUsageSchema>;

export interface PlatformUsageParams {
  days: number;
}

export async function getPlatformUsage(params: PlatformUsageParams): Promise<PlatformUsage> {
  const response = await api.get("admin/usage", {
    searchParams: { from: daysAgo(params.days), limit: 25 },
  });
  return platformUsageSchema.parse(await response.json());
}

/** `YYYY-MM-DD`, in UTC — the same calendar the backend reads the range in. */
function daysAgo(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const full = new Intl.NumberFormat("en");

/**
 * Formats a count that arrived as a string without going through `Number` for
 * anything but display. A total large enough to lose precision is also large
 * enough that nobody is reading its last three digits.
 */
export function formatCount(value: string, style: "compact" | "full" = "compact"): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return value;
  return style === "compact" ? compact.format(parsed) : full.format(parsed);
}

/**
 * Provider cost, which spans six orders of magnitude on one screen: a single
 * chat turn costs $0.002 while a quarter across every workspace costs hundreds.
 * Two decimals would print most rows as "$0.00" and six would make the total
 * unreadable, so the size of the number picks the precision.
 */
export function formatCost(value: string): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return value;
  if (parsed === 0) return "$0";
  if (parsed < 0.01) return `$${parsed.toFixed(4)}`;
  if (parsed < 1) return `$${parsed.toFixed(3)}`;
  return `$${parsed.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Credits are whole numbers in practice; the fraction exists for pricing, not for reading. */
export function formatCredits(value: string): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return value;
  return full.format(Math.round(parsed));
}

export function totalTokens(row: { inputTokens: string; outputTokens: string; embeddingTokens: string }): string {
  return String(Number(row.inputTokens) + Number(row.outputTokens) + Number(row.embeddingTokens));
}
