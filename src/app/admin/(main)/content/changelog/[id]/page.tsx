import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

import {
  ChangelogDetail,
  ChangelogError,
  ChangelogLoading,
} from "@/features/changelog/components";
import { prefetchChangelogEntry } from "@/features/changelog/server/prefetch";
import { requireAuth } from "@/lib/auth";
import { getQueryClient } from "@/lib/get-query-client";

export default async function ChangelogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();

  const { id } = await params;
  await prefetchChangelogEntry(id);

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <ErrorBoundary fallback={<ChangelogError />}>
        <Suspense fallback={<ChangelogLoading />}>
          <ChangelogDetail id={id} />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
