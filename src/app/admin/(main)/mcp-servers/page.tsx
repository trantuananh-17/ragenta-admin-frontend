import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

import {
  McpServersError,
  McpServersLoading,
  McpServersView,
} from "@/features/mcp-servers/components";
import { prefetchMcpServers } from "@/features/mcp-servers/server/prefetch";
import { requireAuth } from "@/lib/auth";
import { getQueryClient } from "@/lib/get-query-client";

export default async function McpServersPage() {
  await requireAuth();
  await prefetchMcpServers();

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <ErrorBoundary fallback={<McpServersError />}>
        <Suspense fallback={<McpServersLoading />}>
          <McpServersView />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
