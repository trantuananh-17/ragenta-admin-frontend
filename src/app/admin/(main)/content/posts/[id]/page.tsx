import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

import {
  PostDetail,
  PostDetailError,
  PostDetailLoading,
} from "@/features/posts/components";
import { prefetchPost } from "@/features/posts/server/prefetch";
import { requireAuth } from "@/lib/auth";
import { getQueryClient } from "@/lib/get-query-client";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();

  const { id } = await params;
  await prefetchPost(id);

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <ErrorBoundary fallback={<PostDetailError />}>
        <Suspense fallback={<PostDetailLoading />}>
          <PostDetail id={id} />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
