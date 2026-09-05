import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

import {
  PromoCodesError,
  PromoCodesLoading,
  PromoCodesView,
} from "@/features/promo-codes/components";
import { prefetchPromoCodes } from "@/features/promo-codes/server/prefetch";
import { requireAuth } from "@/lib/auth";
import { getQueryClient } from "@/lib/get-query-client";

export default async function PromoCodesPage() {
  await requireAuth();
  await prefetchPromoCodes();

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <ErrorBoundary fallback={<PromoCodesError />}>
        <Suspense fallback={<PromoCodesLoading />}>
          <PromoCodesView />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
