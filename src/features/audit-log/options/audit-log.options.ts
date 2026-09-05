import { queryOptions } from "@tanstack/react-query";

import { getAuditLog } from "../service/audit-log.service";
import type { AuditLogParams } from "../params";

export const auditLogKeys = {
  all: () => ["audit-log"] as const,
  list: (params: AuditLogParams) =>
    [...auditLogKeys.all(), "list", params] as const,
};

export const auditLogOptions = {
  list: (params: AuditLogParams) =>
    queryOptions({
      queryKey: auditLogKeys.list(params),
      queryFn: () => getAuditLog(params),
    }),
};
