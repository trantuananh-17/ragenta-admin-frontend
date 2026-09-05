import { Suspense } from "react";
import type { SearchParams } from "nuqs/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

import {
  PostsContainer,
  PostsError,
  PostsLoading,
  PostsTable,
} from "@/features/posts/components";
import { postsParamsLoader } from "@/features/posts/server/params-loader";
import { prefetchPosts } from "@/features/posts/server/prefetch";
import { requireAuth } from "@/lib/auth";
import { getQueryClient } from "@/lib/get-query-client";

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAuth();

  const params = await postsParamsLoader(searchParams);
  await prefetchPosts(params);

  return (
    <PostsContainer>
      <HydrationBoundary state={dehydrate(getQueryClient())}>
        <ErrorBoundary fallback={<PostsError />}>
          <Suspense fallback={<PostsLoading />}>
            <PostsTable />
          </Suspense>
        </ErrorBoundary>
      </HydrationBoundary>
    </PostsContainer>
  );
}
