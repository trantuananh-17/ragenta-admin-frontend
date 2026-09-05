import { createLoader } from "nuqs/server";

import { auditLogParams, type AuditLogParams } from "../params";

export const auditLogParamsLoader = createLoader(auditLogParams);

export type { AuditLogParams };
