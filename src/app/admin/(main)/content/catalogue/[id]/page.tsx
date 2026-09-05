import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

import {
  CatalogueDetail,
  CatalogueError,
  CatalogueLoading,
} from "@/features/catalogue/components";
import { prefetchCatalogueItem } from "@/features/catalogue/server/prefetch";
import { requireAuth } from "@/lib/auth";
import { getQueryClient } from "@/lib/get-query-client";

export default async function CatalogueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();

  const { id } = await params;
  await prefetchCatalogueItem(id);

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <ErrorBoundary fallback={<CatalogueError />}>
        <Suspense fallback={<CatalogueLoading />}>
          <CatalogueDetail id={id} />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
