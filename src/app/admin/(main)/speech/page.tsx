import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

import { SpeechError, SpeechLoading, SpeechView } from "@/features/speech/components";
import { prefetchSpeechSettings } from "@/features/speech/server/prefetch";
import { requireAuth } from "@/lib/auth";
import { getQueryClient } from "@/lib/get-query-client";

export default async function SpeechPage() {
  await requireAuth();
  await prefetchSpeechSettings();

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <ErrorBoundary fallback={<SpeechError />}>
        <Suspense fallback={<SpeechLoading />}>
          <SpeechView />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
