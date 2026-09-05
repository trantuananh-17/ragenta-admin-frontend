import { Suspense } from "react";
import type { SearchParams } from "nuqs/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

import {
  UsersContainer,
  UsersError,
  UsersLoading,
  UsersTable,
} from "@/features/users/components";
import { usersParamsLoader } from "@/features/users/server/params-loader";
import { prefetchUsers } from "@/features/users/server/prefetch";
import { requireAuth } from "@/lib/auth";
import { getQueryClient } from "@/lib/get-query-client";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAuth();

  const params = await usersParamsLoader(searchParams);
  await prefetchUsers(params);

  return (
    <UsersContainer>
      <HydrationBoundary state={dehydrate(getQueryClient())}>
        <ErrorBoundary fallback={<UsersError />}>
          <Suspense fallback={<UsersLoading />}>
            <UsersTable />
          </Suspense>
        </ErrorBoundary>
      </HydrationBoundary>
    </UsersContainer>
  );
}
