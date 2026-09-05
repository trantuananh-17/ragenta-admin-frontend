"use client";

import { useState } from "react";

import { DetailSection } from "@/components/detail-shell";
import { LocaleTabs } from "@/components/locale-tabs";
import { TagInput } from "@/components/tag-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/locale";
import type {
  CatalogueItem,
  CreateCatalogueItemInput,
} from "@/features/catalogue/service/catalogue.service";

export interface CatalogueFormValues {
  name: string;
  slug: string;
  featured: boolean;
  sortOrder: number;
  status: string;
  description: Record<Locale, string>;
  tags: Record<Locale, string[]>;
}

export function initialValues(item?: CatalogueItem): CatalogueFormValues {
  const description = Object.fromEntries(
    LOCALES.map((locale) => [locale, item?.description?.[locale] ?? ""]),
  ) as Record<Locale, string>;

  const tags = Object.fromEntries(
    LOCALES.map((locale) => [locale, item?.tags?.[locale] ?? []]),
  ) as Record<Locale, string[]>;

  return {
    name: item?.name ?? "",
    slug: item?.slug ?? "",
    featured: item?.featured ?? false,
    sortOrder: item?.sortOrder ?? 0,
    status: item?.status ?? "draft",
    description,
    tags,
  };
}

/**
 * The backend's localized schemas are strict: `en` is required and every value
 * must be non-empty, so an empty Vietnamese field is omitted rather than sent
 * as `""` — which would be rejected for the whole item.
 */
export function toPayload(
  values: CatalogueFormValues,
): Omit<CreateCatalogueItemInput, "slug"> {
  return {
    name: values.name.trim(),
    description: {
      en: values.description.en.trim(),
      ...(values.description.vi.trim()
        ? { vi: values.description.vi.trim() }
        : {}),
    },
    tags: {
      en: values.tags.en,
      ...(values.tags.vi.length > 0 ? { vi: values.tags.vi } : {}),
    },
    featured: values.featured,
    sortOrder: values.sortOrder,
    status: values.status,
  };
}

export function CatalogueForm({
  mode,
  values,
  onChange,
  disabled,
}: {
  mode: "create" | "edit";
  values: CatalogueFormValues;
  onChange: (values: CatalogueFormValues) => void;
  disabled?: boolean;
}) {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);

  return (
    <>
      <DetailSection
        title="Item"
        description="The name is a product name, not copy — it is deliberately not translated."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={values.name}
              disabled={disabled}
              placeholder="Claude Opus 4.5"
              onChange={(event) => onChange({ ...values, name: event.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={values.slug}
              disabled={disabled || mode === "edit"}
              placeholder="Derived from the name when left empty"
              onChange={(event) => onChange({ ...values, slug: event.target.value })}
            />
            {mode === "edit" && (
              <p className="text-xs text-muted-foreground">
                Fixed — the slug is this item&apos;s id to the site.
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sortOrder">Sort order</Label>
            <Input
              id="sortOrder"
              type="number"
              min={0}
              max={9999}
              value={values.sortOrder}
              disabled={disabled}
              onChange={(event) =>
                onChange({ ...values, sortOrder: Number(event.target.value) || 0 })
              }
            />
            <p className="text-xs text-muted-foreground">
              Ordering within the featured and non-featured groups. Ties break on
              name.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={values.status}
              onValueChange={(status) => onChange({ ...values, status })}
            >
              <SelectTrigger id="status" disabled={disabled}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 sm:col-span-2">
            <Switch
              id="featured"
              checked={values.featured}
              disabled={disabled}
              onCheckedChange={(featured) => onChange({ ...values, featured })}
            />
            <Label htmlFor="featured" className="font-normal">
              Featured — sorts above everything else in its section
            </Label>
          </div>
        </div>
      </DetailSection>

      <DetailSection
        title="Copy"
        description="English is required. A locale with no translation renders the English text rather than a blank card."
      >
        <LocaleTabs
          locale={locale}
          onLocaleChange={setLocale}
          filled={{
            en: values.description.en.trim().length > 0,
            vi: values.description.vi.trim().length > 0,
          }}
        >
          {() => (
            <>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={values.description[locale]}
                  disabled={disabled}
                  onChange={(event) =>
                    onChange({
                      ...values,
                      description: {
                        ...values.description,
                        [locale]: event.target.value,
                      },
                    })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tags">Tags</Label>
                <TagInput
                  id="tags"
                  value={values.tags[locale]}
                  disabled={disabled}
                  placeholder="chat, reasoning, long context"
                  onChange={(tags) =>
                    onChange({ ...values, tags: { ...values.tags, [locale]: tags } })
                  }
                />
              </div>
            </>
          )}
        </LocaleTabs>
      </DetailSection>
    </>
  );
}
