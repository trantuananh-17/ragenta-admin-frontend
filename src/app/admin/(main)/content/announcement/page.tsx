import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

import {
  AnnouncementEditor,
  AnnouncementError,
  AnnouncementLoading,
} from "@/features/announcement/components/announcement-editor";
import { prefetchAnnouncement } from "@/features/announcement/server/prefetch";
import { requireAuth } from "@/lib/auth";
import { getQueryClient } from "@/lib/get-query-client";

export default async function AnnouncementPage() {
  await requireAuth();
  await prefetchAnnouncement();

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <ErrorBoundary fallback={<AnnouncementError />}>
        <Suspense fallback={<AnnouncementLoading />}>
          <AnnouncementEditor />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
