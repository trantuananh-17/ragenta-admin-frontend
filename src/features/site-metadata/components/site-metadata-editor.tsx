"use client";

import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { DetailSection, DetailShell } from "@/components/detail-shell";
import { EntityStateView } from "@/components/entity-components";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  usePutSiteMetadata,
  useSiteMetadataSuspense,
} from "@/features/site-metadata/hooks/site-metadata.hook";
import {
  SITE_METADATA_KEYS,
  SITE_METADATA_LABELS,
  type SiteMetadataKey,
} from "@/features/site-metadata/service/site-metadata.service";
import { formatDateTime } from "@/lib/format";

/**
 * Each setting saves on its own. They are unrelated URLs — batching them into one
 * form would make a typo in the docs link block a correction to the status page.
 */
export function SiteMetadataEditor() {
  const { data: settings } = useSiteMetadataSuspense();
  const save = usePutSiteMetadata();

  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      SITE_METADATA_KEYS.map((key) => [
        key,
        settings.find((setting) => setting.key === key)?.value ?? "",
      ]),
    ),
  );

  return (
    <DetailShell>
      <PageHeader
        title="Site settings"
        description="Small values the marketing site links to. The key set is fixed on the backend — a key nothing reads cannot be created here."
      />

      <DetailSection title="Links">
        <div className="space-y-6">
          {SITE_METADATA_KEYS.map((key) => {
            const stored = settings.find((setting) => setting.key === key);
            const draft = drafts[key] ?? "";
            const dirty = draft !== (stored?.value ?? "");
            const pending = save.isPending && save.variables?.key === key;

            return (
              <div key={key} className="grid gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Label htmlFor={key}>{SITE_METADATA_LABELS[key].label}</Label>
                  <span className="font-mono text-xs text-muted-foreground">
                    {key}
                  </span>
                  {!stored && <StatusBadge tone="warning">not set</StatusBadge>}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Input
                    id={key}
                    className="min-w-[260px] flex-1"
                    value={draft}
                    disabled={pending}
                    placeholder="https://..."
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                  />
                  <Button
                    size="sm"
                    disabled={!dirty || !draft.trim() || pending}
                    onClick={() =>
                      save.mutate({
                        key: key as SiteMetadataKey,
                        value: draft.trim(),
                      })
                    }
                  >
                    {pending ? "Saving..." : "Save"}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  {SITE_METADATA_LABELS[key].hint}
                  {stored && ` Last saved ${formatDateTime(stored.updatedAt)}.`}
                </p>
              </div>
            );
          })}
        </div>
      </DetailSection>
    </DetailShell>
  );
}

export function SiteMetadataLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export function SiteMetadataError() {
  return (
    <EntityStateView
      icon={<AlertCircle className="size-8 text-destructive" />}
      title="Could not load the site settings"
      message="The content backend refused or is unreachable."
    />
  );
}
