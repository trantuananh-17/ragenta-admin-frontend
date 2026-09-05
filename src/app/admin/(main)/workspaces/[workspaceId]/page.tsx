import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

import {
  WorkspaceDetail,
  WorkspaceDetailError,
  WorkspaceDetailLoading,
} from "@/features/workspaces/components";
import { prefetchWorkspace } from "@/features/workspaces/server/prefetch";
import { requireAuth } from "@/lib/auth";
import { getQueryClient } from "@/lib/get-query-client";

export default async function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  await requireAuth();

  const { workspaceId } = await params;
  await prefetchWorkspace(workspaceId);

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <ErrorBoundary fallback={<WorkspaceDetailError />}>
        <Suspense fallback={<WorkspaceDetailLoading />}>
          <WorkspaceDetail workspaceId={workspaceId} />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
