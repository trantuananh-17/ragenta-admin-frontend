import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

import {
  SiteMetadataEditor,
  SiteMetadataError,
  SiteMetadataLoading,
} from "@/features/site-metadata/components/site-metadata-editor";
import { prefetchSiteMetadata } from "@/features/site-metadata/server/prefetch";
import { requireAuth } from "@/lib/auth";
import { getQueryClient } from "@/lib/get-query-client";

export default async function SiteMetadataPage() {
  await requireAuth();
  await prefetchSiteMetadata();

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <ErrorBoundary fallback={<SiteMetadataError />}>
        <Suspense fallback={<SiteMetadataLoading />}>
          <SiteMetadataEditor />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
