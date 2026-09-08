import { z } from "zod";

import { api } from "@/lib/ky";

/**
 * `GET /v1/admin/oauth-providers` — the OAuth apps this deployment has
 * registered, and the redirect URI each provider must be told about.
 *
 * Until one is registered, every Gmail, Drive, Calendar, Sheets, Slack, GitHub
 * and Notion tool refuses: a workspace cannot connect an account without a
 * client id and secret to authorise against. This screen is what unblocks them.
 */
export const oauthProviderSchema = z.object({
  id: z.string(),
  name: z.string(),
  scopes: z.array(z.string()),
  /** Registered *and* switched on — the one question a workspace's screen asks. */
  configured: z.boolean(),
  /** A client id and a secret are both stored. Says nothing about the switch. */
  registered: z.boolean(),
  enabled: z.boolean(),
  /** Not a secret: it travels in the query string of every consent screen. */
  clientId: z.string(),
  hasSecret: z.boolean(),
  redirectUri: z.string(),
});

export type OAuthProvider = z.infer<typeof oauthProviderSchema>;

const providersResponse = z.object({ providers: z.array(oauthProviderSchema) });

export async function getOAuthProviders(): Promise<OAuthProvider[]> {
  const response = await api.get("admin/oauth-providers");
  return providersResponse.parse(await response.json()).providers;
}

export interface SaveOAuthClientInput {
  clientId: string;
  /** Omitted keeps the stored secret — a form resubmitted without it must not delete one. */
  clientSecret?: string;
  enabled: boolean;
}

export async function saveOAuthClient(
  provider: string,
  input: SaveOAuthClientInput,
): Promise<OAuthProvider[]> {
  const response = await api.put(`admin/oauth-providers/${provider}`, { json: input });
  return providersResponse.parse(await response.json()).providers;
}
