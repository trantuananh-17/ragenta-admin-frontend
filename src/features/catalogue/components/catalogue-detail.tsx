"use client";

import { useState } from "react";
import { TrashIcon } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { DetailShell } from "@/components/detail-shell";
import { PageHeader } from "@/components/page-header";
import { ContentStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  useCatalogueItemSuspense,
  useDeleteCatalogueItem,
  useUpdateCatalogueItem,
} from "@/features/catalogue/hooks/catalogue.hook";
import { formatDateTime } from "@/lib/format";
import {
  CatalogueForm,
  initialValues,
  toPayload,
  type CatalogueFormValues,
} from "./catalogue-form";

export function CatalogueDetail({ id }: { id: string }) {
  const { data: item } = useCatalogueItemSuspense(id);
  const [values, setValues] = useState<CatalogueFormValues>(() =>
    initialValues(item),
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  const update = useUpdateCatalogueItem(id);
  const remove = useDeleteCatalogueItem();
  const busy = update.isPending || remove.isPending;

  const save = () => {
    if (!values.name.trim() || !values.description.en.trim()) {
      toast.error("Name and English description are required");
      return;
    }
    update.mutate(toPayload(values));
  };

  return (
    <DetailShell>
      <PageHeader
        back={{ href: "/admin/content/catalogue", label: "Catalogue" }}
        title={item.name}
        description={
          <span className="font-mono text-xs">
            {item.slug} · last edited {formatDateTime(item.updatedAt)}
          </span>
        }
        badges={<ContentStatusBadge status={item.status} />}
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
            <Button size="sm" onClick={save} disabled={busy}>
              {update.isPending ? "Saving..." : "Save"}
            </Button>
          </>
        }
      />

      <CatalogueForm
        mode="edit"
        values={values}
        onChange={setValues}
        disabled={busy}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this item"
        description={`${item.name} is removed from the catalogue for good.`}
        confirmLabel="Delete"
        destructive
        pending={remove.isPending}
        onConfirm={() => remove.mutate(id)}
      />
    </DetailShell>
  );
}
