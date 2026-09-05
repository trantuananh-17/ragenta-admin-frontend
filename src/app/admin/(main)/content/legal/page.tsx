import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

import { LegalError, LegalList, LegalLoading } from "@/features/legal/components";
import { prefetchLegalDocuments } from "@/features/legal/server/prefetch";
import { requireAuth } from "@/lib/auth";
import { getQueryClient } from "@/lib/get-query-client";

export default async function LegalPage() {
  await requireAuth();
  await prefetchLegalDocuments();

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <ErrorBoundary fallback={<LegalError />}>
        <Suspense fallback={<LegalLoading />}>
          <LegalList />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
