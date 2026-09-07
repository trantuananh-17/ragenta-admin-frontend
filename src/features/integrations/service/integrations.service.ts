import { z } from "zod";

import { api } from "@/lib/ky";

/**
 * `/v1/admin/integrations` — the outside systems an agent is allowed to act on.
 *
 * Separate from the model providers on purpose. Those hold the keys for the
 * models Ragenta runs; these hold keys for systems a *customer's agent* reaches
 * out to, and the blast radius is different enough that the two should be
 * reasoned about apart.
 *
 * The allowlists on each row are the security boundary, not a convenience: an
 * agent may only call an integration that exists, with a method it lists, under
 * a path it permits. None of that comes from the agent's configuration or from
 * the model, which matters because a page an agent fetched can and will try to
 * talk it into more.
 */
export const INTEGRATION_KINDS = ["web_search", "http_api", "email"] as const;
export type IntegrationKind = (typeof INTEGRATION_KINDS)[number];

export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

export const integrationSchema = z.object({
  id: z.string(),
  kind: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  enabled: z.boolean(),
  baseUrl: z.string().nullable(),
  /** Whether a key is stored. The key itself is never returned. */
  hasSecret: z.boolean(),
  secretHint: z.string().nullable(),
  authHeader: z.string().nullable(),
  authPrefix: z.string().default(""),
  allowedMethods: z.array(z.string()).default([]),
  allowedPathPrefix: z.string().default(""),
  allowedRecipients: z.array(z.string()).default([]),
  lastUsedAt: z.coerce.string().nullable(),
  lastCheckedAt: z.coerce.string().nullable(),
  lastCheckOk: z.boolean().nullable(),
  lastCheckError: z.string().nullable(),
  updatedAt: z.coerce.string(),
});

export type Integration = z.infer<typeof integrationSchema>;

export interface SaveIntegrationInput {
  kind: IntegrationKind;
  name: string;
  description?: string | null;
  enabled: boolean;
  baseUrl?: string | null;
  /** Omitted keeps the stored key, so editing an allowlist is not a rotation. */
  secret?: string;
  authHeader?: string | null;
  authPrefix?: string;
  allowedMethods: string[];
  allowedPathPrefix?: string;
  allowedRecipients?: string[];
}

export async function getIntegrations(): Promise<Integration[]> {
  const response = await api.get("admin/integrations");
  return z.array(integrationSchema).parse(await response.json());
}

export async function saveIntegration(
  id: string,
  input: SaveIntegrationInput,
): Promise<Integration> {
  const response = await api.put(`admin/integrations/${id}`, {
    json: {
      kind: input.kind,
      name: input.name,
      description: input.description ?? null,
      enabled: input.enabled,
      baseUrl: input.baseUrl ?? null,
      // Only sent when the administrator actually typed one.
      ...(input.secret ? { secret: input.secret } : {}),
      authHeader: input.authHeader ?? null,
      authPrefix: input.authPrefix ?? "",
      allowedMethods: input.allowedMethods,
      allowedPathPrefix: input.allowedPathPrefix ?? "",
      allowedRecipients: input.allowedRecipients ?? [],
    },
  });
  return integrationSchema.parse(await response.json());
}

export async function deleteIntegration(id: string): Promise<void> {
  await api.delete(`admin/integrations/${id}`);
}

export const checkResultSchema = z.object({
  ok: z.boolean(),
  detail: z.string(),
});

export async function checkIntegration(id: string) {
  const response = await api.post(`admin/integrations/${id}/check`);
  return checkResultSchema.parse(await response.json());
}
