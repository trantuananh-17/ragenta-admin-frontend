import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

import {
  PlansError,
  PlansLoading,
  PlansView,
} from "@/features/plans/components/plans-view";
import { prefetchPlans } from "@/features/plans/server/prefetch";
import { requireAuth } from "@/lib/auth";
import { getQueryClient } from "@/lib/get-query-client";

export default async function PlansPage() {
  await requireAuth();
  await prefetchPlans();

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <ErrorBoundary fallback={<PlansError />}>
        <Suspense fallback={<PlansLoading />}>
          <PlansView />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
