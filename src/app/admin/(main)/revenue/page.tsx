import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

import { RevenueError, RevenueLoading, RevenueView } from "@/features/revenue/components";
import { prefetchRevenue } from "@/features/revenue/server/prefetch";
import { requireAuth } from "@/lib/auth";
import { getQueryClient } from "@/lib/get-query-client";

export default async function RevenuePage() {
  await requireAuth();
  // Matches the view's own default range, so the first paint is served from the
  // prefetch rather than refetched the moment it mounts.
  await prefetchRevenue({ days: 30 });

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <ErrorBoundary fallback={<RevenueError />}>
        <Suspense fallback={<RevenueLoading />}>
          <RevenueView />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
