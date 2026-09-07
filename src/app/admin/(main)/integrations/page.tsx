import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

import {
  IntegrationsError,
  IntegrationsLoading,
  IntegrationsView,
} from "@/features/integrations/components";
import { prefetchIntegrations } from "@/features/integrations/server/prefetch";
import { requireAuth } from "@/lib/auth";
import { getQueryClient } from "@/lib/get-query-client";

export default async function IntegrationsPage() {
  await requireAuth();
  await prefetchIntegrations();

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <ErrorBoundary fallback={<IntegrationsError />}>
        <Suspense fallback={<IntegrationsLoading />}>
          <IntegrationsView />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
