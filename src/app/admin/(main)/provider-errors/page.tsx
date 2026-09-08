import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

import {
  ProviderErrorsError,
  ProviderErrorsLoading,
  ProviderErrorsView,
} from "@/features/provider-errors/components";
import { prefetchProviderErrors } from "@/features/provider-errors/server/prefetch";
import { requireAuth } from "@/lib/auth";
import { getQueryClient } from "@/lib/get-query-client";

export default async function ProviderErrorsPage() {
  await requireAuth();
  await prefetchProviderErrors();

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <ErrorBoundary fallback={<ProviderErrorsError />}>
        <Suspense fallback={<ProviderErrorsLoading />}>
          <ProviderErrorsView />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
