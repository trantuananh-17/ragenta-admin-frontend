import { z } from "zod";

import { api } from "@/lib/ky";
import { pageSchema, toOffset } from "@/lib/pagination";
import type { AuditLogParams } from "../params";

/**
 * `GET /v1/admin/audit-log`. The table is append-only — there is nothing to
 * mutate here, and deliberately no endpoint that would let one try.
 *
 * `actorId` is null when the account has since been deleted: the trail outlives
 * the person it describes.
 */
export const auditEntrySchema = z.object({
  id: z.string(),
  actorId: z.string().nullable(),
  organizationId: z.string().nullable(),
  /** A dotted verb, e.g. `workspace.member.role_changed`. */
  action: z.string(),
  targetType: z.string().nullable(),
  targetId: z.string().nullable(),
  status: z.string(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.coerce.string(),
});

export const auditLogPageSchema = pageSchema(auditEntrySchema);

export type AuditEntry = z.infer<typeof auditEntrySchema>;
export type AuditLogPage = z.infer<typeof auditLogPageSchema>;

export async function getAuditLog(
  params: AuditLogParams,
): Promise<AuditLogPage> {
  const searchParams: Record<string, string | number> = {
    limit: params.limit,
    offset: toOffset(params.page, params.limit),
  };
  // The backend reads the workspace filter as `workspaceId` and maps it to the
  // column itself; sending `organizationId` would be silently ignored.
  if (params.workspaceId) searchParams.workspaceId = params.workspaceId;
  if (params.actorId) searchParams.actorId = params.actorId;
  if (params.action) searchParams.action = params.action;

  const response = await api.get("admin/audit-log", { searchParams });
  return auditLogPageSchema.parse(await response.json());
}
