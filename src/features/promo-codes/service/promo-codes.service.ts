import { z } from "zod";

import { api } from "@/lib/ky";
import { pageSchema } from "@/lib/pagination";

/**
 * `/v1/admin/promo-codes` — redeemable codes that grant credits to a workspace.
 *
 * The shape follows what the ledger can actually do. A redemption lands in one
 * of the two buckets `credit_transaction` has, and only the *code* expires —
 * `credit_balance` has no per-grant expiry, so a promo cannot promise "credits
 * valid 30 days" the way the reference console offers. `bucket` is the honest
 * choice in its place: plan credits are replaced at the next refill, top-up
 * credits roll over.
 *
 * Redemptions are a separate endpoint, not an array on the code. A code handed
 * out at a conference can have thousands, and a list of 25 codes must not carry
 * all of them.
 */
export const promoStatusSchema = z.enum([
  "active",
  "inactive",
  "expired",
  "exhausted",
]);

export const promoActorSchema = z.object({
  name: z.string().nullable(),
  email: z.string().nullable(),
});

export const promoCodeSchema = z.object({
  id: z.string(),
  code: z.string(),
  credits: z.number(),
  bucket: z.enum(["plan", "topup"]),
  /** When the code stops being redeemable. Credits already granted are unaffected. */
  expiresAt: z.string(),
  /** null means unlimited. */
  maxRedemptions: z.number().nullable(),
  redeemedCount: z.number(),
  active: z.boolean(),
  /** Derived server-side, so the badge here and the redeem check there agree. */
  status: promoStatusSchema,
  createdAt: z.string(),
  createdBy: promoActorSchema.nullable(),
  updatedAt: z.string().nullable(),
  updatedBy: promoActorSchema.nullable(),
});

export const promoRedemptionSchema = z.object({
  id: z.string(),
  credits: z.number(),
  redeemedAt: z.string(),
  workspaceId: z.string(),
  workspaceName: z.string().nullable(),
  redeemedBy: promoActorSchema.nullable(),
});

export const promoCodesPageSchema = pageSchema(promoCodeSchema);
export const promoRedemptionsPageSchema = pageSchema(promoRedemptionSchema);

export type PromoCode = z.infer<typeof promoCodeSchema>;
export type PromoRedemption = z.infer<typeof promoRedemptionSchema>;
export type PromoStatus = z.infer<typeof promoStatusSchema>;
export type PromoActor = z.infer<typeof promoActorSchema>;

export interface CreatePromoCodeInput {
  code: string;
  credits: number;
  bucket: "plan" | "topup";
  expiresAt: string;
  maxRedemptions: number | null;
}

export async function listPromoCodes(limit = 100) {
  const response = await api.get("admin/promo-codes", {
    searchParams: { limit },
  });
  return promoCodesPageSchema.parse(await response.json());
}

export async function listPromoRedemptions(promoCodeId: string) {
  const response = await api.get(
    `admin/promo-codes/${promoCodeId}/redemptions`,
    { searchParams: { limit: 100 } },
  );
  return promoRedemptionsPageSchema.parse(await response.json());
}

export async function createPromoCode(
  input: CreatePromoCodeInput,
): Promise<PromoCode> {
  const response = await api.post("admin/promo-codes", { json: input });
  return promoCodeSchema.parse(await response.json());
}

export async function setPromoCodeActive(
  id: string,
  active: boolean,
): Promise<PromoCode> {
  const response = await api.patch(`admin/promo-codes/${id}`, {
    json: { active },
  });
  return promoCodeSchema.parse(await response.json());
}

export async function deletePromoCode(id: string): Promise<void> {
  await api.delete(`admin/promo-codes/${id}`);
}
