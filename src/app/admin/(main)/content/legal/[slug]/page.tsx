import { Suspense } from "react";
import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

import { LegalEditor, LegalError, LegalLoading } from "@/features/legal/components";
import { prefetchLegalDocument } from "@/features/legal/server/prefetch";
import {
  LEGAL_SLUGS,
  type LegalSlug,
} from "@/features/legal/service/legal.service";
import { requireAuth } from "@/lib/auth";
import { getQueryClient } from "@/lib/get-query-client";

export default async function LegalDocumentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAuth();

  const { slug } = await params;
  // The slug set is closed, so anything else is a typed URL, not a document.
  if (!(LEGAL_SLUGS as readonly string[]).includes(slug)) notFound();

  await prefetchLegalDocument(slug as LegalSlug);

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <ErrorBoundary fallback={<LegalError />}>
        <Suspense fallback={<LegalLoading />}>
          <LegalEditor slug={slug as LegalSlug} />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
