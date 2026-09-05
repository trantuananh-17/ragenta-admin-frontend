import { Suspense } from "react";
import type { SearchParams } from "nuqs/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

import {
  WorkspacesContainer,
  WorkspacesError,
  WorkspacesLoading,
  WorkspacesTable,
} from "@/features/workspaces/components";
import { workspacesParamsLoader } from "@/features/workspaces/server/params-loader";
import { prefetchWorkspaces } from "@/features/workspaces/server/prefetch";
import { requireAuth } from "@/lib/auth";
import { getQueryClient } from "@/lib/get-query-client";

export default async function WorkspacesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAuth();

  const params = await workspacesParamsLoader(searchParams);
  await prefetchWorkspaces(params);

  return (
    <WorkspacesContainer>
      <HydrationBoundary state={dehydrate(getQueryClient())}>
        <ErrorBoundary fallback={<WorkspacesError />}>
          <Suspense fallback={<WorkspacesLoading />}>
            <WorkspacesTable />
          </Suspense>
        </ErrorBoundary>
      </HydrationBoundary>
    </WorkspacesContainer>
  );
}
