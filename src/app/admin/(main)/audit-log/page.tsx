import { Suspense } from "react";
import type { SearchParams } from "nuqs/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

import {
  AuditLogContainer,
  AuditLogError,
  AuditLogLoading,
  AuditLogTable,
} from "@/features/audit-log/components";
import { auditLogParamsLoader } from "@/features/audit-log/server/params-loader";
import { prefetchAuditLog } from "@/features/audit-log/server/prefetch";
import { requireAuth } from "@/lib/auth";
import { getQueryClient } from "@/lib/get-query-client";

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAuth();

  const params = await auditLogParamsLoader(searchParams);
  await prefetchAuditLog(params);

  return (
    <AuditLogContainer>
      <HydrationBoundary state={dehydrate(getQueryClient())}>
        <ErrorBoundary fallback={<AuditLogError />}>
          <Suspense fallback={<AuditLogLoading />}>
            <AuditLogTable />
          </Suspense>
        </ErrorBoundary>
      </HydrationBoundary>
    </AuditLogContainer>
  );
}
