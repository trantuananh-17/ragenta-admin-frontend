import { z } from "zod";

import { api } from "@/lib/ky";

/**
 * `GET /v1/admin/mcp-servers` — MCP servers every workspace on this deployment
 * can reach.
 *
 * Platform-wide, as against the ones a workspace configures for itself: adding
 * one here gives every agent in every workspace its tools, which is why the
 * screen treats the allowlist as a decision rather than a detail.
 *
 * The secret is never in this shape — only the masked hint (ADR-021).
 */
export const mcpToolSchema = z.object({
  name: z.string(),
  description: z.string(),
});

export const mcpServerSchema = z.object({
  id: z.string(),
  /** Null for a platform-wide server; a workspace id for one a tenant owns. */
  organizationId: z.string().nullable(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  enabled: z.boolean(),
  url: z.string(),
  secretHint: z.string().nullable(),
  authHeader: z.string(),
  /** Empty accepts every tool the server advertises, now and later. */
  allowedTools: z.array(z.string()),
  /** What the last check found the server offering. */
  tools: z.array(mcpToolSchema),
  toolsCachedAt: z.coerce.string().nullable(),
  lastCheckedAt: z.coerce.string().nullable(),
  lastCheckOk: z.boolean().nullable(),
  lastCheckError: z.string().nullable(),
});

export type McpServer = z.infer<typeof mcpServerSchema>;
export type McpTool = z.infer<typeof mcpToolSchema>;

const listResponse = z.object({ servers: z.array(mcpServerSchema) });
const oneResponse = z.object({ server: mcpServerSchema });

export async function getMcpServers(): Promise<McpServer[]> {
  const response = await api.get("admin/mcp-servers");
  return listResponse.parse(await response.json()).servers;
}

export interface SaveMcpServerInput {
  slug: string;
  name: string;
  description: string;
  url: string;
  enabled: boolean;
  /**
   * Omitted keeps the stored secret; `null` clears it. Absent and null are
   * different on purpose — a form resubmitted without the field must not
   * silently delete a credential, and there has to be a way to say there is
   * none.
   */
  secret?: string | null;
  authHeader: string;
  authPrefix: string;
  allowedTools: string[];
}

export async function saveMcpServer(input: SaveMcpServerInput): Promise<McpServer> {
  const response = await api.put("admin/mcp-servers", { json: input });
  return oneResponse.parse(await response.json()).server;
}

export async function deleteMcpServer(serverId: string): Promise<void> {
  await api.delete(`admin/mcp-servers/${serverId}`);
}

/** Asks the server what it offers and records the outcome. */
export async function checkMcpServer(serverId: string): Promise<McpServer> {
  const response = await api.post(`admin/mcp-servers/${serverId}/check`);
  return oneResponse.parse(await response.json()).server;
}

/** The id an agent version stores for one of this server's tools. */
export function toolId(slug: string, tool: string): string {
  return `mcp:${slug}:${tool}`;
}
