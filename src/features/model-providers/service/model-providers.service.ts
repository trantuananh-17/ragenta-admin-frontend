/**
 * Model providers and their credentials — **UI only**. Nothing here crosses the
 * network, and a reload restores the fixture below.
 *
 * It is a prototype for a capability the platform does not have yet, and the gap
 * is worth stating precisely. Today `ragenta-backend` reads provider keys from
 * environment variables (`src/ai/providers.ts`) and ships its catalogue as a
 * TypeScript table (`src/ai/models.ts`) — so there is no key to edit and no
 * model row to toggle. Making this screen real means both move into the database
 * behind an admin API, with the key encrypted at rest and never returned.
 *
 * That last part is already honoured here: a key is write-only. What comes back
 * is a masked hint, which is all any response should ever carry.
 *
 * The three supported providers and their models mirror the real catalogue
 * exactly, so the numbers on screen are the numbers that bill. The rest of the
 * list is providers a platform would plausibly reach for next; they carry no
 * models, because inventing prices for models nobody has integrated would put
 * fiction where an admin expects rates.
 */

export type ModelCapability = "chat" | "embedding";
export type ModelTier = "economy" | "premium";

export interface ModelRates {
  /** USD per million tokens. Zero where the capability does not apply. */
  inputPerMillion: number;
  outputPerMillion: number;
  embeddingPerMillion: number;
}

export interface ProviderModel {
  id: string;
  model: string;
  capability: ModelCapability;
  tier: ModelTier;
  contextWindow: number | null;
  rates: ModelRates;
  /** Off means no workspace can select it, whatever their plan allows. */
  enabled: boolean;
  /** Added through this screen rather than shipped in the backend catalogue. */
  custom: boolean;
}

export interface ProviderCredential {
  configured: boolean;
  /** Masked. The stored key is never returned by an API and never shown here. */
  hint: string | null;
  /** Set only for providers reached through a self-hosted or regional endpoint. */
  baseUrl: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface ModelProvider {
  id: string;
  name: string;
  description: string;
  /** Whether ragenta-backend can call this provider today. */
  supported: boolean;
  credential: ProviderCredential;
  models: ProviderModel[];
}

export interface ModelSelection {
  provider: string;
  model: string;
}

export interface PlatformModelDefaults {
  chat: ModelSelection;
  embedding: ModelSelection;
}

export interface SaveProviderKeyInput {
  apiKey: string;
  baseUrl: string | null;
}

export interface AddCustomModelInput {
  model: string;
  capability: ModelCapability;
  tier: ModelTier;
  contextWindow: number | null;
  rates: ModelRates;
}

const CURRENT_ACTOR = "admin@ragenta.cloud";

/**
 * What a masked hint looks like. Enough to tell two keys apart on sight,
 * nowhere near enough to use one.
 */
export function maskKey(apiKey: string): string {
  const trimmed = apiKey.trim();
  if (trimmed.length <= 8) return "••••";
  return `${trimmed.slice(0, 3)}••••${trimmed.slice(-4)}`;
}

function chat(
  model: string,
  tier: ModelTier,
  contextWindow: number,
  input: number,
  output: number,
  enabled = true,
): ProviderModel {
  return {
    id: model,
    model,
    capability: "chat",
    tier,
    contextWindow,
    rates: {
      inputPerMillion: input,
      outputPerMillion: output,
      embeddingPerMillion: 0,
    },
    enabled,
    custom: false,
  };
}

function embedding(model: string, rate: number): ProviderModel {
  return {
    id: model,
    model,
    capability: "embedding",
    tier: "economy",
    contextWindow: null,
    rates: {
      inputPerMillion: 0,
      outputPerMillion: 0,
      embeddingPerMillion: rate,
    },
    enabled: true,
    custom: false,
  };
}

/** A provider Ragenta has no adapter for: listed, selectable, but inert. */
function available(
  id: string,
  name: string,
  description: string,
): ModelProvider {
  return {
    id,
    name,
    description,
    supported: false,
    credential: {
      configured: false,
      hint: null,
      baseUrl: null,
      updatedAt: null,
      updatedBy: null,
    },
    models: [],
  };
}

let providers: ModelProvider[] = [
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude. The default chat provider.",
    supported: true,
    credential: {
      configured: true,
      hint: "sk-••••9f31",
      baseUrl: null,
      updatedAt: "2026-08-28T09:14:00.000Z",
      updatedBy: CURRENT_ACTOR,
    },
    models: [
      chat("claude-opus-5", "premium", 200_000, 15, 75),
      chat("claude-sonnet-5", "premium", 200_000, 3, 15),
      chat("claude-haiku-4-5", "economy", 200_000, 1, 5),
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT and the embedding models the ingestion pipeline runs on.",
    supported: true,
    credential: {
      configured: true,
      hint: "sk-••••02ac",
      baseUrl: null,
      updatedAt: "2026-08-28T09:16:00.000Z",
      updatedBy: CURRENT_ACTOR,
    },
    models: [
      chat("gpt-4o", "premium", 128_000, 2.5, 10),
      chat("gpt-4o-mini", "economy", 128_000, 0.15, 0.6),
      embedding("text-embedding-3-small", 0.02),
      embedding("text-embedding-3-large", 0.13),
    ],
  },
  {
    id: "google",
    name: "Google",
    description: "Gemini. The long-context option — a million tokens.",
    supported: true,
    credential: {
      configured: false,
      hint: null,
      baseUrl: null,
      updatedAt: null,
      updatedBy: null,
    },
    models: [
      chat("gemini-2.5-pro", "premium", 1_000_000, 1.25, 10),
      chat("gemini-2.5-flash", "economy", 1_000_000, 0.3, 2.5),
    ],
  },
  available(
    "azure-openai",
    "Azure OpenAI",
    "The same OpenAI models under an Azure deployment and its own endpoint.",
  ),
  available("mistral", "Mistral", "Open-weight European models."),
  available("deepseek", "DeepSeek", "Low-cost reasoning models."),
  available("groq", "Groq", "Open models served at very low latency."),
  available("xai", "xAI", "Grok."),
  available("cohere", "Cohere", "Command, and the Rerank models."),
  available("voyage", "Voyage AI", "Embedding and reranking only."),
  available(
    "ollama",
    "Ollama",
    "Models on your own hardware, reached over a base URL.",
  ),
];

let defaults: PlatformModelDefaults = {
  chat: { provider: "anthropic", model: "claude-haiku-4-5" },
  embedding: { provider: "openai", model: "text-embedding-3-small" },
};

function replace(id: string, update: (provider: ModelProvider) => ModelProvider) {
  providers = providers.map((provider) =>
    provider.id === id ? update(provider) : provider,
  );
  const next = providers.find((provider) => provider.id === id);
  if (!next) throw new Error("That provider no longer exists.");
  return next;
}

export async function listProviders(): Promise<ModelProvider[]> {
  return providers;
}

export async function getPlatformDefaults(): Promise<PlatformModelDefaults> {
  return defaults;
}

export async function saveProviderKey(
  id: string,
  input: SaveProviderKeyInput,
): Promise<ModelProvider> {
  return replace(id, (provider) => ({
    ...provider,
    credential: {
      configured: true,
      hint: maskKey(input.apiKey),
      baseUrl: input.baseUrl,
      updatedAt: new Date().toISOString(),
      updatedBy: CURRENT_ACTOR,
    },
  }));
}

export async function removeProviderKey(id: string): Promise<ModelProvider> {
  return replace(id, (provider) => ({
    ...provider,
    credential: {
      configured: false,
      hint: null,
      baseUrl: null,
      updatedAt: new Date().toISOString(),
      updatedBy: CURRENT_ACTOR,
    },
  }));
}

export async function setModelEnabled(
  providerId: string,
  modelId: string,
  enabled: boolean,
): Promise<ModelProvider> {
  return replace(providerId, (provider) => ({
    ...provider,
    models: provider.models.map((model) =>
      model.id === modelId ? { ...model, enabled } : model,
    ),
  }));
}

export async function addCustomModel(
  providerId: string,
  input: AddCustomModelInput,
): Promise<ModelProvider> {
  return replace(providerId, (provider) => {
    if (provider.models.some((model) => model.model === input.model)) {
      throw new Error(`${provider.name} already lists ${input.model}.`);
    }
    return {
      ...provider,
      models: [
        ...provider.models,
        { id: input.model, ...input, enabled: true, custom: true },
      ],
    };
  });
}

export async function removeCustomModel(
  providerId: string,
  modelId: string,
): Promise<ModelProvider> {
  return replace(providerId, (provider) => ({
    ...provider,
    models: provider.models.filter(
      (model) => !(model.id === modelId && model.custom),
    ),
  }));
}

export async function setPlatformDefaults(
  next: PlatformModelDefaults,
): Promise<PlatformModelDefaults> {
  defaults = next;
  return defaults;
}
