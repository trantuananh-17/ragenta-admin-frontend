import { z } from "zod";

import { api } from "@/lib/ky";

/**
 * `GET /v1/admin/revenue` — what the deployment earns against what it costs.
 *
 * **Run rate and collected money are not the same thing and are never added.**
 * The run rate is what today's active subscriptions bill in a month; it ignores
 * the report's date range, because a plan price does not accrue over the last
 * thirty days. Collected is money that actually moved inside the range, which on
 * this product means top-up packs and nothing else — there is no invoice table,
 * only Stripe.
 *
 * The margin therefore compares provider cost against *collected*. A report that
 * folded a monthly figure into a seven-day range would look wildly profitable
 * and the same data over ninety days would look ruinous.
 */

const planRunRateSchema = z.object({
  plan: z.string(),
  workspaces: z.number(),
  seats: z.number(),
  usd: z.number(),
});

const workspaceCostSchema = z.object({
  workspaceId: z.string(),
  name: z.string(),
  usd: z.string(),
  credits: z.string(),
  calls: z.number(),
});

export const revenueSchema = z.object({
  range: z.object({ from: z.string(), to: z.string() }),
  runRate: z.object({
    mrrUsd: z.number(),
    /** On a plan with no list price — enterprise, invoiced by hand. */
    unpricedWorkspaces: z.number(),
    workspaces: z.number(),
    byPlan: z.array(planRunRateSchema),
  }),
  collected: z.object({
    usd: z.number(),
    /** Split so a month of subscriptions is not confused with a month of top-ups. */
    subscriptionUsd: z.number().nullish(),
    topupUsd: z.number().nullish(),
    payments: z.number().nullish(),
    credits: z.number(),
    purchases: z.number(),
    /** Credits granted as a top-up that match no pack we sell. */
    unpricedCredits: z.number(),
  }),
  cost: z.object({ usd: z.number(), credits: z.number(), calls: z.number() }),
  margin: z.object({ usd: z.number(), ratio: z.number().nullable() }),
  costByWorkspace: z.array(workspaceCostSchema),
  daily: z.array(z.object({ day: z.string(), usd: z.string() })),
});

export type Revenue = z.infer<typeof revenueSchema>;
export type WorkspaceCost = z.infer<typeof workspaceCostSchema>;

export interface RevenueParams {
  days: number;
}

export async function getRevenue(params: RevenueParams): Promise<Revenue> {
  const response = await api.get("admin/revenue", {
    searchParams: { from: daysAgo(params.days), limit: 25 },
  });
  return revenueSchema.parse(await response.json());
}

/** `YYYY-MM-DD`, in UTC — the same calendar the backend reads the range in. */
function daysAgo(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}
