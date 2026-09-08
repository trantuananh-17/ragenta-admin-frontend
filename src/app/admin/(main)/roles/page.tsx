import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

import { RolesError, RolesLoading, RolesView } from "@/features/roles/components";
import { prefetchRoles } from "@/features/roles/server/prefetch";
import { requireAuth } from "@/lib/auth";
import { getQueryClient } from "@/lib/get-query-client";

export default async function RolesPage() {
  await requireAuth();
  await prefetchRoles();

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <ErrorBoundary fallback={<RolesError />}>
        <Suspense fallback={<RolesLoading />}>
          <RolesView />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
