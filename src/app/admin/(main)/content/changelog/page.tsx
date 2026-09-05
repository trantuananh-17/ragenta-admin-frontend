import { Suspense } from "react";
import type { SearchParams } from "nuqs/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

import {
  ChangelogContainer,
  ChangelogError,
  ChangelogLoading,
  ChangelogTable,
} from "@/features/changelog/components";
import { changelogParamsLoader } from "@/features/changelog/server/params-loader";
import { prefetchChangelog } from "@/features/changelog/server/prefetch";
import { requireAuth } from "@/lib/auth";
import { getQueryClient } from "@/lib/get-query-client";

export default async function ChangelogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAuth();

  const params = await changelogParamsLoader(searchParams);
  await prefetchChangelog(params);

  return (
    <ChangelogContainer>
      <HydrationBoundary state={dehydrate(getQueryClient())}>
        <ErrorBoundary fallback={<ChangelogError />}>
          <Suspense fallback={<ChangelogLoading />}>
            <ChangelogTable />
          </Suspense>
        </ErrorBoundary>
      </HydrationBoundary>
    </ChangelogContainer>
  );
}
