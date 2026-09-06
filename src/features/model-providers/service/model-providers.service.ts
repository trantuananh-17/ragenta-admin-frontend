import { z } from "zod";

import { api } from "@/lib/ky";

/**
 * `/v1/admin/providers` — the provider keys Ragenta calls with, and the model
 * catalogue those keys unlock.
 *
 * Platform-level, not per workspace: Ragenta pays for inference and customers
 * spend credits, so a key here is the platform's and every workspace calling
 * that provider bills against it.
 *
 * A key is **write-only over the wire**. It is submitted, stored encrypted, and
 * never returned — what comes back is `hint`, the masked form. That is a
 * property of the API, not a convenience of this screen: an admin endpoint that
 * could return a provider key would turn one compromised session into a stolen
 * credential that outlives it.
 *
 * The catalogue is the built-in table in `ragenta-backend/src/ai/models.ts`
 * merged with the `provider_model` rows written from here, so what is on screen
 * is what the backend will actually price and offer.
 */
/**
 * Must stay in step with `ModelCapability` in the backend's `src/ai/models.ts`.
 *
 * These are two hand-kept copies of one enum with nothing checking they agree,
 * and that has already cost an outage: `rerank` was added to the backend
 * catalogue and this screen went from working to "Could not load model
 * providers" — a zod parse failure on a 200 response, which reads as the backend
 * being down. Anything added there has to be added here in the same release.
 */
export const modelCapabilitySchema = z.enum(["chat", "embedding", "rerank"]);
export const modelTierSchema = z.enum(["economy", "premium"]);

export type ModelCapability = z.infer<typeof modelCapabilitySchema>;
export type ModelTier = z.infer<typeof modelTierSchema>;

export interface ModelRates {
  /** USD per million tokens. Zero where the capability does not apply. */
  inputPerMillion: number;
  outputPerMillion: number;
  embeddingPerMillion: number;
}

/**
 * The backend names these `input` / `output` / `embedding`, next to the model
 * they belong to. The longer names here say the unit, which matters on a screen
 * where somebody is typing a price in.
 */
const ratesSchema = z
  .object({
    input: z.number(),
    output: z.number(),
    embedding: z.number(),
  })
  .transform(
    (rates): ModelRates => ({
      inputPerMillion: rates.input,
      outputPerMillion: rates.output,
      embeddingPerMillion: rates.embedding,
    }),
  );

export const providerModelSchema = z.object({
  id: z.string(),
  provider: z.string(),
  model: z.string(),
  /**
   * Read as a plain string, not as the enum above.
   *
   * A capability this build has not heard of is a backend that is ahead of it,
   * which is normal during a rollout — and a strict enum turns that into a zod
   * throw that blanks the entire screen behind "the backend refused or is
   * unreachable", on a 200 response. The form still writes the strict enum,
   * because what may be *created* is this build's business; what may be
   * *displayed* is not.
   */
  capability: z.string(),
  tier: modelTierSchema,
  contextWindow: z.number().nullable(),
  /** Embedding models only. It decides which vector collection they index into. */
  embeddingDimensions: z.number().nullable(),
  rates: ratesSchema,
  /** Off means no workspace can select it, whatever their plan allows. */
  enabled: z.boolean(),
  /** Stored in `provider_model` rather than compiled into the backend catalogue. */
  custom: z.boolean(),
});

export const providerCredentialSchema = z.object({
  configured: z.boolean(),
  /** Masked. The stored key is never returned by the API and never shown here. */
  hint: z.string().nullable(),
  /** Set only for providers reached through a self-hosted or regional endpoint. */
  baseUrl: z.string().nullable(),
  updatedAt: z.string().nullable(),
  /** The result of the last live call made from the "Test connection" button. */
  lastCheckedAt: z.string().nullable(),
  lastCheckOk: z.boolean().nullable(),
  lastCheckError: z.string().nullable(),
});

export const modelProviderSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  /** Whether ragenta-backend has a client for this provider at all. */
  supported: z.boolean(),
  /** The provider publishes a priced catalogue, so it can be pulled rather than typed. */
  importable: z.boolean().default(false),
  /** What the key looks like, shown as a placeholder. */
  keyHint: z.string(),
  /** True for providers with no default host — a self-hosted server. */
  requiresBaseUrl: z.boolean(),
  defaultBaseUrl: z.string().nullable(),
  credential: providerCredentialSchema,
  models: z.array(providerModelSchema),
});

export const modelSelectionSchema = z.object({
  provider: z.string(),
  model: z.string(),
});

export const platformDefaultsSchema = z.object({
  chat: modelSelectionSchema,
  embedding: modelSelectionSchema,
});

export const providersResponseSchema = z.object({
  defaults: platformDefaultsSchema,
  /**
   * False when `SECRETS_ENCRYPTION_KEY` is unset. The backend then refuses to
   * store a key rather than writing one in the clear, and the screen has to say
   * so — otherwise saving looks broken for a reason nobody can see.
   */
  encryptionConfigured: z.boolean(),
  providers: z.array(modelProviderSchema),
});

/**
 * What one plan may run, per capability.
 *
 * `allowed` holds `provider:model` keys, and **empty means unrestricted within
 * the plan's tier** — not "no models". A deployment that has never opened this
 * screen keeps the tier rule it always had; filling a list in is how an
 * administrator opts into the narrower one.
 */
export const capabilityAccessSchema = z.object({
  allowed: z.array(z.string()),
  default: modelSelectionSchema.nullable(),
});

export const planModelAccessSchema = z.object({
  chat: capabilityAccessSchema,
  embedding: capabilityAccessSchema,
  /** No default: a reranker is chosen per knowledge base, never workspace-wide. */
  rerank: capabilityAccessSchema.omit({ default: true }),
});

export const PLAN_NAMES = ["free", "pro", "team", "enterprise"] as const;
export type PlanName = (typeof PLAN_NAMES)[number];

export const planModelAccessMapSchema = z.object({
  free: planModelAccessSchema,
  pro: planModelAccessSchema,
  team: planModelAccessSchema,
  enterprise: planModelAccessSchema,
});

export type CapabilityAccess = z.infer<typeof capabilityAccessSchema>;
export type PlanModelAccess = z.infer<typeof planModelAccessSchema>;
export type PlanModelAccessMap = z.infer<typeof planModelAccessMapSchema>;

export const checkResultSchema = z.object({
  ok: z.boolean(),
  checkedAt: z.string(),
  detail: z.string(),
  models: z.array(z.string()).optional(),
});

export type ProviderModel = z.infer<typeof providerModelSchema>;
export type ProviderCredential = z.infer<typeof providerCredentialSchema>;
export type ModelProvider = z.infer<typeof modelProviderSchema>;
export type ModelSelection = z.infer<typeof modelSelectionSchema>;
export type PlatformModelDefaults = z.infer<typeof platformDefaultsSchema>;
export type ProvidersResponse = z.infer<typeof providersResponseSchema>;
export const importResultSchema = z.object({
  provider: z.string(),
  imported: z.number(),
  detail: z.string(),
});

export type CheckResult = z.infer<typeof checkResultSchema>;
export type ImportResult = z.infer<typeof importResultSchema>;

export interface SaveProviderKeyInput {
  apiKey: string;
  baseUrl: string | null;
}

export interface UpsertModelInput {
  model: string;
  capability: ModelCapability;
  tier: ModelTier;
  contextWindow: number | null;
  embeddingDimensions: number | null;
  rates: ModelRates;
}

export async function listProviders(): Promise<ProvidersResponse> {
  const response = await api.get("admin/providers");
  return providersResponseSchema.parse(await response.json());
}

export async function getPlatformDefaults(): Promise<PlatformModelDefaults> {
  const response = await api.get("admin/settings/models");
  return platformDefaultsSchema.parse(await response.json());
}

export async function setPlatformDefaults(
  next: PlatformModelDefaults,
): Promise<PlatformModelDefaults> {
  const response = await api.put("admin/settings/models", { json: next });
  return platformDefaultsSchema.parse(await response.json());
}

export async function saveProviderKey(
  providerId: string,
  input: SaveProviderKeyInput,
): Promise<ProvidersResponse> {
  const response = await api.put(`admin/providers/${providerId}/credential`, {
    json: { apiKey: input.apiKey, baseUrl: input.baseUrl },
  });
  return providersResponseSchema.parse(await response.json());
}

export async function removeProviderKey(
  providerId: string,
): Promise<ProvidersResponse> {
  const response = await api.delete(`admin/providers/${providerId}/credential`);
  return providersResponseSchema.parse(await response.json());
}

/**
 * One live call to the provider with the stored key. A rejected key comes back
 * as `ok: false` with a 200, not as an error — "your key is refused" is the
 * answer to the question that was asked.
 */
export async function checkProvider(providerId: string): Promise<CheckResult> {
  const response = await api.post(`admin/providers/${providerId}/check`);
  return checkResultSchema.parse(await response.json());
}

/**
 * Pull the provider's own catalogue, priced from its own API.
 *
 * Offered only where a provider publishes prices machine-readably. It upserts
 * and never deletes, so it doubles as the way to refresh prices that have moved
 * since the last import.
 */
export async function importProviderModels(
  providerId: string,
): Promise<ImportResult> {
  const response = await api.post(`admin/providers/${providerId}/models/import`);
  return importResultSchema.parse(await response.json());
}

export async function upsertModel(
  providerId: string,
  input: UpsertModelInput,
): Promise<ProvidersResponse> {
  const response = await api.post("admin/models", {
    json: {
      provider: providerId,
      model: input.model,
      capability: input.capability,
      tier: input.tier,
      contextWindow: input.contextWindow,
      embeddingDimensions: input.embeddingDimensions,
      inputPerMillion: input.rates.inputPerMillion,
      outputPerMillion: input.rates.outputPerMillion,
      embeddingPerMillion: input.rates.embeddingPerMillion,
      enabled: true,
    },
  });
  return providersResponseSchema.parse(await response.json());
}

export async function setModelEnabled(
  providerId: string,
  model: string,
  enabled: boolean,
): Promise<ProvidersResponse> {
  const response = await api.patch(
    `admin/providers/${providerId}/models/${encodeURIComponent(model)}`,
    { json: { enabled } },
  );
  return providersResponseSchema.parse(await response.json());
}

/**
 * Drops the stored row. A model that also exists in the built-in catalogue
 * reverts to its compiled definition rather than disappearing, which is why the
 * response says which happened.
 */
export async function removeModel(
  providerId: string,
  model: string,
): Promise<{ removed: boolean; revertedToBuiltIn: boolean }> {
  const response = await api.delete(
    `admin/providers/${providerId}/models/${encodeURIComponent(model)}`,
  );
  return z
    .object({ removed: z.boolean(), revertedToBuiltIn: z.boolean() })
    .parse(await response.json());
}

export async function getPlanModelAccess(): Promise<PlanModelAccessMap> {
  const response = await api.get("admin/settings/model-access");
  return planModelAccessMapSchema.parse(await response.json());
}

/**
 * One plan per request. The screen edits one at a time, and sending the whole
 * map would let a tab left open overwrite a plan somebody else just changed.
 */
export async function setPlanModelAccess(
  plan: PlanName,
  input: PlanModelAccess,
): Promise<PlanModelAccessMap> {
  const response = await api.put(`admin/settings/model-access/${plan}`, {
    json: input,
  });
  return planModelAccessMapSchema.parse(await response.json());
}
