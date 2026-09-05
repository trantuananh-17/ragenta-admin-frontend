import { Suspense } from "react";
import type { SearchParams } from "nuqs/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

import {
  CatalogueContainer,
  CatalogueError,
  CatalogueLoading,
  CatalogueTable,
} from "@/features/catalogue/components";
import { catalogueParamsLoader } from "@/features/catalogue/server/params-loader";
import { prefetchCatalogue } from "@/features/catalogue/server/prefetch";
import { requireAuth } from "@/lib/auth";
import { getQueryClient } from "@/lib/get-query-client";

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAuth();

  const params = await catalogueParamsLoader(searchParams);
  await prefetchCatalogue(params);

  return (
    <CatalogueContainer>
      <HydrationBoundary state={dehydrate(getQueryClient())}>
        <ErrorBoundary fallback={<CatalogueError />}>
          <Suspense fallback={<CatalogueLoading />}>
            <CatalogueTable />
          </Suspense>
        </ErrorBoundary>
      </HydrationBoundary>
    </CatalogueContainer>
  );
}
