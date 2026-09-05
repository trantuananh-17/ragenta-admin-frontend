import { z } from "zod";

import { api } from "@/lib/ky";
import { planLimitsSchema } from "@/features/workspaces/service/workspaces.service";

/**
 * `GET /v1/plans` — the price list, served from the same constants the backend
 * enforces. Read-only on purpose: changing a plan is a code change in
 * `ragenta-backend/src/modules/billing/plans.ts`, not an admin action, because
 * the seat cap and the refill job read the same numbers.
 */
export const plansResponseSchema = z.object({
  signupGrantCredits: z.number(),
  plans: z.array(planLimitsSchema.extend({ name: z.string() })),
  topupPacks: z.array(
    z.object({
      id: z.string(),
      credits: z.number(),
      priceUsd: z.number(),
      usdPerMillionCredits: z.number(),
    }),
  ),
});

export type PlansResponse = z.infer<typeof plansResponseSchema>;
export type PlanEntry = PlansResponse["plans"][number];

export async function getPlans(): Promise<PlansResponse> {
  const response = await api.get("plans");
  return plansResponseSchema.parse(await response.json());
}
