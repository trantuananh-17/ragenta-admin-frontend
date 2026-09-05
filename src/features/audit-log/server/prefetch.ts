import "server-only";

import { getQueryClient } from "@/lib/get-query-client";
import { auditLogOptions } from "../options/audit-log.options";
import type { AuditLogParams } from "../params";

export async function prefetchAuditLog(params: AuditLogParams) {
  await getQueryClient().prefetchQuery(auditLogOptions.list(params));
}
