"use client";

import { useState } from "react";
import { toast } from "sonner";

import { DetailShell } from "@/components/detail-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useCreateCatalogueItem } from "@/features/catalogue/hooks/catalogue.hook";
import {
  CatalogueForm,
  initialValues,
  toPayload,
  type CatalogueFormValues,
} from "./catalogue-form";

export function CatalogueCreate() {
  const [values, setValues] = useState<CatalogueFormValues>(() => initialValues());
  const create = useCreateCatalogueItem();

  const submit = () => {
    if (!values.name.trim() || !values.description.en.trim()) {
      toast.error("Name and English description are required");
      return;
    }

    create.mutate({
      ...toPayload(values),
      ...(values.slug.trim() ? { slug: values.slug.trim() } : {}),
    });
  };

  return (
    <DetailShell>
      <PageHeader
        back={{ href: "/admin/content/catalogue", label: "Catalogue" }}
        title="New catalogue item"
        actions={
          <Button onClick={submit} disabled={create.isPending}>
            {create.isPending ? "Creating..." : "Create item"}
          </Button>
        }
      />

      <CatalogueForm
        mode="create"
        values={values}
        onChange={setValues}
        disabled={create.isPending}
      />
    </DetailShell>
  );
}
