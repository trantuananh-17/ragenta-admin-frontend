"use client";

import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";

import { DetailShell } from "@/components/detail-shell";
import { EntityStateView } from "@/components/entity-components";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useLegalDocumentsSuspense } from "@/features/legal/hooks/legal.hook";
import {
  LEGAL_SLUGS,
  LEGAL_TITLES,
} from "@/features/legal/service/legal.service";
import { formatDateTime } from "@/lib/format";

/**
 * The slug set is fixed, so this lists all of them rather than only the ones
 * that exist. A document that has never been written shows as "not written" —
 * which is the state that makes the site fall back to its own bundled copy, and
 * the thing an administrator most needs to see.
 */
export function LegalList() {
  const { data: documents } = useLegalDocumentsSuspense();

  return (
    <DetailShell>
      <PageHeader
        title="Legal documents"
        description="The privacy policy and terms of service. Two fixed documents — each has a page routed to it on the site, so neither can be created or removed here."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {LEGAL_SLUGS.map((slug) => {
          const document = documents.find((entry) => entry.slug === slug);

          return (
            <div key={slug} className="rounded-lg border bg-background p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="font-medium">{LEGAL_TITLES[slug]}</h2>
                  <p className="font-mono text-xs text-muted-foreground">{slug}</p>
                </div>
                {document ? (
                  <StatusBadge tone="success">written</StatusBadge>
                ) : (
                  <StatusBadge tone="warning">not written</StatusBadge>
                )}
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                {document
                  ? `Last updated ${formatDateTime(document.updatedAt)}`
                  : "The site answers 404 for this document and falls back to its bundled copy."}
              </p>

              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link href={`/admin/content/legal/${slug}`}>
                  {document ? "Edit" : "Write it"}
                </Link>
              </Button>
            </div>
          );
        })}
      </div>
    </DetailShell>
  );
}

export function LegalLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export function LegalError() {
  return (
    <EntityStateView
      icon={<AlertCircle className="size-8 text-destructive" />}
      title="Could not load the legal documents"
      message="The content backend refused or is unreachable."
    />
  );
}
