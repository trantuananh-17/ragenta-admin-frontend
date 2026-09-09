import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

import { PaymentsError, PaymentsLoading, PaymentsView } from "@/features/payments/components";
import { prefetchPayments } from "@/features/payments/server/prefetch";
import { requireAuth } from "@/lib/auth";
import { getQueryClient } from "@/lib/get-query-client";

export default async function PaymentsPage() {
  await requireAuth();
  // Matches the view's own first page, so the first paint is served from the
  // prefetch rather than refetched the moment it mounts.
  await prefetchPayments({ page: 0, limit: 50, status: "" });

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <ErrorBoundary fallback={<PaymentsError />}>
        <Suspense fallback={<PaymentsLoading />}>
          <PaymentsView />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
