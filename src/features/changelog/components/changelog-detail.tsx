"use client";

import { useState } from "react";
import { TrashIcon } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { DetailShell } from "@/components/detail-shell";
import { LocaleChips } from "@/components/locale-tabs";
import { PageHeader } from "@/components/page-header";
import { ContentStatusBadge, StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  useChangelogEntrySuspense,
  useChangelogPublication,
  useDeleteChangelogEntry,
  useUpdateChangelogEntry,
} from "@/features/changelog/hooks/changelog.hook";
import { formatDateTime } from "@/lib/format";
import { translatedLocales } from "@/lib/locale";
import {
  ChangelogForm,
  initialValues,
  isFilled,
  toPayload,
  type ChangelogFormValues,
} from "./changelog-form";

export function ChangelogDetail({ id }: { id: string }) {
  const { data: entry } = useChangelogEntrySuspense(id);
  const [values, setValues] = useState<ChangelogFormValues>(() =>
    initialValues(entry),
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  const update = useUpdateChangelogEntry(id);
  const { publish, unpublish } = useChangelogPublication(id);
  const remove = useDeleteChangelogEntry();

  const busy =
    update.isPending || publish.isPending || unpublish.isPending || remove.isPending;

  const save = () => {
    if (!isFilled(values.translations.en)) {
      toast.error("English is required", {
        description: "It is the fallback every other locale resolves through.",
      });
      return;
    }

    update.mutate({
      entryDate: values.entryDate,
      version: values.version.trim() || null,
      type: values.type,
      translations: {
        en: toPayload(values.translations.en),
        ...(isFilled(values.translations.vi)
          ? { vi: toPayload(values.translations.vi) }
          : {}),
      },
    });
  };

  const isPublished = entry.status === "published";

  return (
    <DetailShell>
      <PageHeader
        back={{ href: "/admin/content/changelog", label: "Changelog" }}
        title={values.translations.en.title || entry.entryDate}
        description={
          <span className="font-mono text-xs">
            {entry.entryDate} · last edited {formatDateTime(entry.updatedAt)}
          </span>
        }
        badges={
          <>
            <ContentStatusBadge status={entry.status} />
            <StatusBadge tone="info">{entry.type}</StatusBadge>
            <LocaleChips locales={translatedLocales(entry.translations)} />
          </>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              disabled={busy}
            >
              <TrashIcon className="size-4" />
              Delete
            </Button>
            {isPublished ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => unpublish.mutate()}
                disabled={busy}
              >
                Unpublish
              </Button>
            ) : (
              <Button size="sm" onClick={() => publish.mutate()} disabled={busy}>
                Publish
              </Button>
            )}
            <Button size="sm" onClick={save} disabled={busy}>
              {update.isPending ? "Saving..." : "Save"}
            </Button>
          </>
        }
      />

      <ChangelogForm values={values} onChange={setValues} disabled={busy} />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this entry"
        description={`The ${entry.entryDate} entry and every translation of it are removed for good.`}
        confirmLabel="Delete"
        destructive
        pending={remove.isPending}
        onConfirm={() => remove.mutate(id)}
      />
    </DetailShell>
  );
}
