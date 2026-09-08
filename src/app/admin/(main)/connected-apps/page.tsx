import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

import {
  OAuthAppsError,
  OAuthAppsLoading,
  OAuthAppsView,
} from "@/features/oauth-apps/components";
import { prefetchOAuthProviders } from "@/features/oauth-apps/server/prefetch";
import { requireAuth } from "@/lib/auth";
import { getQueryClient } from "@/lib/get-query-client";

export default async function ConnectedAppsPage() {
  await requireAuth();
  await prefetchOAuthProviders();

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <ErrorBoundary fallback={<OAuthAppsError />}>
        <Suspense fallback={<OAuthAppsLoading />}>
          <OAuthAppsView />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
