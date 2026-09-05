"use client";

import { useState } from "react";

import { DetailSection } from "@/components/detail-shell";
import { LocaleTabs } from "@/components/locale-tabs";
import { MarkdownPreview } from "@/components/markdown-preview";
import { TagInput } from "@/components/tag-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/locale";
import type {
  PostDetail,
  PostTranslationInput,
} from "@/features/posts/service/posts.service";

export interface PostFormValues {
  slug: string;
  heroImageUrl: string;
  translations: Record<Locale, PostTranslationInput>;
}

function emptyTranslation(): PostTranslationInput {
  return {
    title: "",
    excerpt: "",
    bodyMd: "",
    seoTitle: "",
    seoDescription: "",
    tags: [],
  };
}

export function initialValues(post?: PostDetail): PostFormValues {
  const translations = Object.fromEntries(
    LOCALES.map((locale) => {
      const found = post?.translations.find(
        (translation) => translation.locale === locale,
      );
      return [
        locale,
        found
          ? {
              title: found.title,
              excerpt: found.excerpt ?? "",
              bodyMd: found.bodyMd,
              seoTitle: found.seoTitle ?? "",
              seoDescription: found.seoDescription ?? "",
              tags: found.tags,
              readingMinutes: found.readingMinutes,
            }
          : emptyTranslation(),
      ];
    }),
  ) as Record<Locale, PostTranslationInput>;

  return {
    slug: post?.slug ?? "",
    heroImageUrl: post?.heroImageUrl ?? "",
    translations,
  };
}

/** A locale counts as written only once it has both a title and a body. */
export function isFilled(translation: PostTranslationInput): boolean {
  return translation.title.trim().length > 0 && translation.bodyMd.trim().length > 0;
}

/**
 * Strips a translation down to what the backend accepts: empty optional strings
 * become null rather than being sent as `""`, which the schema would reject on
 * the URL field and store as an empty SEO title on the others.
 */
export function toPayload(translation: PostTranslationInput): PostTranslationInput {
  return {
    title: translation.title.trim(),
    excerpt: translation.excerpt?.trim() ? translation.excerpt.trim() : null,
    bodyMd: translation.bodyMd,
    seoTitle: translation.seoTitle?.trim() ? translation.seoTitle.trim() : null,
    seoDescription: translation.seoDescription?.trim()
      ? translation.seoDescription.trim()
      : null,
    tags: translation.tags,
    ...(translation.readingMinutes
      ? { readingMinutes: translation.readingMinutes }
      : {}),
  };
}

interface PostFormProps {
  mode: "create" | "edit";
  values: PostFormValues;
  onChange: (values: PostFormValues) => void;
  disabled?: boolean;
}

export function PostForm({ mode, values, onChange, disabled }: PostFormProps) {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [showPreview, setShowPreview] = useState(false);

  const translation = values.translations[locale];

  const patchTranslation = (patch: Partial<PostTranslationInput>) =>
    onChange({
      ...values,
      translations: {
        ...values.translations,
        [locale]: { ...translation, ...patch },
      },
    });

  return (
    <>
      <DetailSection
        title="Post"
        description="Locale-independent fields. The slug is the post's identity to the site and to search engines — it does not change after creation."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={values.slug}
              disabled={disabled || mode === "edit"}
              placeholder="Derived from the English title when left empty"
              onChange={(event) => onChange({ ...values, slug: event.target.value })}
            />
            {mode === "edit" && (
              <p className="text-xs text-muted-foreground">
                Fixed once published — changing it would break every existing link.
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="heroImageUrl">Hero image URL</Label>
            <Input
              id="heroImageUrl"
              value={values.heroImageUrl}
              disabled={disabled}
              placeholder="https://..."
              onChange={(event) =>
                onChange({ ...values, heroImageUrl: event.target.value })
              }
            />
          </div>
        </div>
      </DetailSection>

      <DetailSection
        title="Content"
        description="English is the fallback every other locale resolves through, so it must be complete before the post can be published."
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreview((current) => !current)}
          >
            {showPreview ? "Hide preview" : "Preview body"}
          </Button>
        }
      >
        <LocaleTabs
          locale={locale}
          onLocaleChange={setLocale}
          filled={{
            en: isFilled(values.translations.en),
            vi: isFilled(values.translations.vi),
          }}
        >
          {() => (
            <>
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={translation.title}
                  disabled={disabled}
                  onChange={(event) =>
                    patchTranslation({ title: event.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  rows={2}
                  value={translation.excerpt ?? ""}
                  disabled={disabled}
                  onChange={(event) =>
                    patchTranslation({ excerpt: event.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bodyMd">Body (Markdown)</Label>
                <Textarea
                  id="bodyMd"
                  rows={16}
                  className="font-mono text-xs"
                  value={translation.bodyMd}
                  disabled={disabled}
                  onChange={(event) =>
                    patchTranslation({ bodyMd: event.target.value })
                  }
                />
              </div>

              {showPreview && (
                <div className="rounded-md border bg-muted/30 p-4">
                  <MarkdownPreview source={translation.bodyMd} />
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="tags">Tags</Label>
                  <TagInput
                    id="tags"
                    value={translation.tags}
                    disabled={disabled}
                    onChange={(tags) => patchTranslation({ tags })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="readingMinutes">Reading minutes</Label>
                  <Input
                    id="readingMinutes"
                    type="number"
                    min={1}
                    max={120}
                    value={translation.readingMinutes ?? ""}
                    disabled={disabled}
                    placeholder="Estimated from the body when empty"
                    onChange={(event) =>
                      patchTranslation({
                        readingMinutes: event.target.value
                          ? Number(event.target.value)
                          : undefined,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="seoTitle">SEO title</Label>
                  <Input
                    id="seoTitle"
                    value={translation.seoTitle ?? ""}
                    disabled={disabled}
                    placeholder="Falls back to the title"
                    onChange={(event) =>
                      patchTranslation({ seoTitle: event.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="seoDescription">SEO description</Label>
                  <Input
                    id="seoDescription"
                    value={translation.seoDescription ?? ""}
                    disabled={disabled}
                    placeholder="Falls back to the excerpt"
                    onChange={(event) =>
                      patchTranslation({ seoDescription: event.target.value })
                    }
                  />
                </div>
              </div>
            </>
          )}
        </LocaleTabs>
      </DetailSection>
    </>
  );
}
