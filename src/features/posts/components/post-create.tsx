"use client";

import { useState } from "react";
import { toast } from "sonner";

import { DetailShell } from "@/components/detail-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useCreatePost } from "@/features/posts/hooks/posts.hook";
import {
  PostForm,
  initialValues,
  isFilled,
  toPayload,
  type PostFormValues,
} from "./post-form";

export function PostCreate() {
  const [values, setValues] = useState<PostFormValues>(() => initialValues());
  const create = useCreatePost();

  const submit = () => {
    if (!isFilled(values.translations.en)) {
      toast.error("English is required", {
        description: "Give the post an English title and body before creating it.",
      });
      return;
    }

    create.mutate({
      ...(values.slug.trim() ? { slug: values.slug.trim() } : {}),
      heroImageUrl: values.heroImageUrl.trim() || null,
      translations: {
        en: toPayload(values.translations.en),
        // Sending an empty Vietnamese translation would create a row the site
        // then prefers over the English fallback.
        ...(isFilled(values.translations.vi)
          ? { vi: toPayload(values.translations.vi) }
          : {}),
      },
    });
  };

  return (
    <DetailShell>
      <PageHeader
        back={{ href: "/admin/content/posts", label: "Blog posts" }}
        title="New post"
        description="Created as a draft. Nothing reaches the site until it is published."
        actions={
          <Button onClick={submit} disabled={create.isPending}>
            {create.isPending ? "Creating..." : "Create draft"}
          </Button>
        }
      />

      <PostForm
        mode="create"
        values={values}
        onChange={setValues}
        disabled={create.isPending}
      />
    </DetailShell>
  );
}
