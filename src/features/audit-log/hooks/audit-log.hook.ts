"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { auditLogOptions } from "../options/audit-log.options";
import type { AuditLogParams } from "../params";

export function useAuditLogSuspense(params: AuditLogParams) {
  return useSuspenseQuery(auditLogOptions.list(params));
}
