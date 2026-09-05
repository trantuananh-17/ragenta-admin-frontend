"use client";

import { useState } from "react";
import { toast } from "sonner";

import { DetailShell } from "@/components/detail-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useCreateChangelogEntry } from "@/features/changelog/hooks/changelog.hook";
import {
  ChangelogForm,
  initialValues,
  isFilled,
  toPayload,
  type ChangelogFormValues,
} from "./changelog-form";

export function ChangelogCreate() {
  const [values, setValues] = useState<ChangelogFormValues>(() => initialValues());
  const create = useCreateChangelogEntry();

  const submit = () => {
    if (!isFilled(values.translations.en)) {
      toast.error("English is required", {
        description: "Give the entry an English title and excerpt first.",
      });
      return;
    }

    create.mutate({
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

  return (
    <DetailShell>
      <PageHeader
        back={{ href: "/admin/content/changelog", label: "Changelog" }}
        title="New changelog entry"
        description="Created as a draft. Nothing reaches the site until it is published."
        actions={
          <Button onClick={submit} disabled={create.isPending}>
            {create.isPending ? "Creating..." : "Create draft"}
          </Button>
        }
      />

      <ChangelogForm
        values={values}
        onChange={setValues}
        disabled={create.isPending}
      />
    </DetailShell>
  );
}
