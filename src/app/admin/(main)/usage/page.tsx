import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

import {
  PlatformUsageError,
  PlatformUsageLoading,
  PlatformUsageView,
} from "@/features/platform-usage/components";
import { prefetchPlatformUsage } from "@/features/platform-usage/server/prefetch";
import { requireAuth } from "@/lib/auth";
import { getQueryClient } from "@/lib/get-query-client";

export default async function UsagePage() {
  await requireAuth();
  // Matches the view's own default range, so the first paint is served from the
  // prefetch rather than refetched the moment it mounts.
  await prefetchPlatformUsage({ days: 30 });

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <ErrorBoundary fallback={<PlatformUsageError />}>
        <Suspense fallback={<PlatformUsageLoading />}>
          <PlatformUsageView />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
