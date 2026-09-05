"use client";

import { useState } from "react";
import { ExternalLinkIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { DetailShell } from "@/components/detail-shell";
import { LocaleChips } from "@/components/locale-tabs";
import { PageHeader } from "@/components/page-header";
import { ContentStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  useDeletePost,
  usePostPublication,
  usePostSuspense,
  useUpdatePost,
} from "@/features/posts/hooks/posts.hook";
import { siteBaseUrl } from "@/lib/config";
import { formatDateTime } from "@/lib/format";
import { translatedLocales } from "@/lib/locale";
import {
  PostForm,
  initialValues,
  isFilled,
  toPayload,
  type PostFormValues,
} from "./post-form";

export function PostDetail({ id }: { id: string }) {
  const { data: post } = usePostSuspense(id);
  const [values, setValues] = useState<PostFormValues>(() => initialValues(post));
  const [confirmDelete, setConfirmDelete] = useState(false);

  const update = useUpdatePost(id);
  const { publish, unpublish } = usePostPublication(id);
  const remove = useDeletePost();

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
      heroImageUrl: values.heroImageUrl.trim() || null,
      translations: {
        en: toPayload(values.translations.en),
        // A locale left out is untouched — which is how an editor can save the
        // English revision without wiping a Vietnamese translation they have not
        // opened.
        ...(isFilled(values.translations.vi)
          ? { vi: toPayload(values.translations.vi) }
          : {}),
      },
    });
  };

  const isPublished = post.status === "published";
  const publicUrl = `${siteBaseUrl()}/en/blog/${post.slug}`;

  return (
    <DetailShell>
      <PageHeader
        back={{ href: "/admin/content/posts", label: "Blog posts" }}
        title={values.translations.en.title || post.slug}
        description={
          <span className="font-mono text-xs">
            {post.slug} · last edited {formatDateTime(post.updatedAt)}
          </span>
        }
        badges={
          <>
            <ContentStatusBadge status={post.status} />
            <LocaleChips locales={translatedLocales(post.translations)} />
          </>
        }
        actions={
          <>
            {isPublished && (
              <Button variant="outline" size="sm" asChild>
                <a href={publicUrl} target="_blank" rel="noreferrer">
                  <ExternalLinkIcon className="size-4" />
                  View live
                </a>
              </Button>
            )}
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

      <PostForm
        mode="edit"
        values={values}
        onChange={setValues}
        disabled={busy}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this post"
        description={`${post.slug} and every translation of it are removed for good. If it is live, the URL starts answering 404.`}
        confirmLabel="Delete"
        destructive
        pending={remove.isPending}
        onConfirm={() => remove.mutate(id)}
      />
    </DetailShell>
  );
}
