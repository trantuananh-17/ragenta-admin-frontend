import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

import {
  ModelProvidersError,
  ModelProvidersLoading,
  ModelProvidersView,
} from "@/features/model-providers/components";
import { prefetchModelProviders } from "@/features/model-providers/server/prefetch";
import { requireAuth } from "@/lib/auth";
import { getQueryClient } from "@/lib/get-query-client";

export default async function ModelsPage() {
  await requireAuth();
  await prefetchModelProviders();

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <ErrorBoundary fallback={<ModelProvidersError />}>
        <Suspense fallback={<ModelProvidersLoading />}>
          <ModelProvidersView />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
