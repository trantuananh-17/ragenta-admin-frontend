import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

import {
  DashboardError,
  DashboardLoading,
  DashboardView,
} from "@/features/dashboard/components/dashboard-view";
import { prefetchDashboard } from "@/features/dashboard/server/prefetch";
import { requireAuth } from "@/lib/auth";
import { getQueryClient } from "@/lib/get-query-client";

export default async function DashboardPage() {
  await requireAuth();
  await prefetchDashboard();

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <ErrorBoundary fallback={<DashboardError />}>
        <Suspense fallback={<DashboardLoading />}>
          <DashboardView />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
