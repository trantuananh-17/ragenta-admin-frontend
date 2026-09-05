/**
 * Promo codes — **UI only**. `ragenta-backend` has no promo-code module yet, so
 * nothing here crosses the network: the list below is the whole world, it lives
 * in the browser tab, and a reload restores it.
 *
 * The shape is not invented freely. A redemption grants credits into one of the
 * two buckets the ledger actually has (`credit_transaction.bucket`), and the
 * grant is attributed to a workspace rather than a person, because that is who
 * owns a balance in Ragenta. Deliberately absent is the per-grant expiry the
 * reference console offers: `credit_balance` expires nothing — plan credits are
 * cleared at the next refill and top-up credits roll over forever — so a field
 * promising anything else would be a lie the backend could not keep.
 *
 * To make it real, replace each function body with a call through `api` and
 * delete the store. The signatures are what the endpoints should return:
 *
 *   GET    /v1/admin/promo-codes
 *   POST   /v1/admin/promo-codes
 *   PATCH  /v1/admin/promo-codes/:id     { active }
 *   DELETE /v1/admin/promo-codes/:id
 */

export type PromoCodeBucket = "topup" | "plan";

export interface PromoActor {
  name: string;
  email: string;
}

export interface PromoRedemption {
  id: string;
  workspaceId: string;
  workspaceName: string;
  credits: number;
  redeemedAt: string;
  redeemedBy: PromoActor;
}

export interface PromoCode {
  id: string;
  code: string;
  credits: number;
  bucket: PromoCodeBucket;
  /** When the code stops being redeemable. Credits already granted are unaffected. */
  expiresAt: string;
  /** null means unlimited. */
  maxRedemptions: number | null;
  active: boolean;
  redemptions: PromoRedemption[];
  createdAt: string;
  createdBy: PromoActor;
  updatedAt: string | null;
  updatedBy: PromoActor | null;
}

export interface CreatePromoCodeInput {
  code: string;
  credits: number;
  bucket: PromoCodeBucket;
  expiresAt: string;
  maxRedemptions: number | null;
}

/** Whoever is signed in would be the actor; the fixture stands in for them. */
const CURRENT_ACTOR: PromoActor = {
  name: "Ragenta Admin",
  email: "admin@ragenta.cloud",
};

function iso(daysFromNow: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromNow);
  return date.toISOString();
}

let store: PromoCode[] = [
  {
    id: "promo_launch",
    code: "LAUNCH2026",
    credits: 2_000_000,
    bucket: "topup",
    expiresAt: iso(21),
    maxRedemptions: 200,
    active: true,
    redemptions: [
      {
        id: "red_1",
        workspaceId: "ws_northwind",
        workspaceName: "Northwind Research",
        credits: 2_000_000,
        redeemedAt: iso(-4),
        redeemedBy: { name: "Mai Tran", email: "mai@northwind.example" },
      },
      {
        id: "red_2",
        workspaceId: "ws_helio",
        workspaceName: "Helio Labs",
        credits: 2_000_000,
        redeemedAt: iso(-2),
        redeemedBy: { name: "Sam Oduya", email: "sam@helio.example" },
      },
    ],
    createdAt: iso(-9),
    createdBy: CURRENT_ACTOR,
    updatedAt: null,
    updatedBy: null,
  },
  {
    id: "promo_webinar",
    code: "WEBINAR-SEP",
    credits: 500_000,
    bucket: "plan",
    expiresAt: iso(-1),
    maxRedemptions: null,
    active: true,
    redemptions: [],
    createdAt: iso(-30),
    createdBy: CURRENT_ACTOR,
    updatedAt: iso(-6),
    updatedBy: CURRENT_ACTOR,
  },
  {
    id: "promo_partner",
    code: "PARTNER-ACME",
    credits: 10_000_000,
    bucket: "topup",
    expiresAt: iso(60),
    maxRedemptions: 1,
    active: false,
    redemptions: [],
    createdAt: iso(-14),
    createdBy: CURRENT_ACTOR,
    updatedAt: iso(-3),
    updatedBy: CURRENT_ACTOR,
  },
];

export async function listPromoCodes(): Promise<PromoCode[]> {
  return store;
}

export async function createPromoCode(
  input: CreatePromoCodeInput,
): Promise<PromoCode> {
  const code = input.code.trim().toUpperCase();
  if (store.some((entry) => entry.code === code)) {
    throw new Error(`${code} already exists.`);
  }

  const created: PromoCode = {
    id: `promo_${crypto.randomUUID().slice(0, 8)}`,
    code,
    credits: input.credits,
    bucket: input.bucket,
    expiresAt: input.expiresAt,
    maxRedemptions: input.maxRedemptions,
    active: true,
    redemptions: [],
    createdAt: new Date().toISOString(),
    createdBy: CURRENT_ACTOR,
    updatedAt: null,
    updatedBy: null,
  };

  store = [created, ...store];
  return created;
}

export async function setPromoCodeActive(
  id: string,
  active: boolean,
): Promise<PromoCode> {
  const next = store.map((entry) =>
    entry.id === id
      ? {
          ...entry,
          active,
          updatedAt: new Date().toISOString(),
          updatedBy: CURRENT_ACTOR,
        }
      : entry,
  );
  store = next;

  const updated = next.find((entry) => entry.id === id);
  if (!updated) throw new Error("That code no longer exists.");
  return updated;
}

export async function deletePromoCode(id: string): Promise<void> {
  const target = store.find((entry) => entry.id === id);
  // The redemption rows are the only record of who claimed a code. Dropping
  // them would let a re-created code be redeemed a second time by the same
  // workspace, so a redeemed code is deactivated, never deleted.
  if (target && target.redemptions.length > 0) {
    throw new Error("This code has been redeemed. Set it inactive instead.");
  }
  store = store.filter((entry) => entry.id !== id);
}
