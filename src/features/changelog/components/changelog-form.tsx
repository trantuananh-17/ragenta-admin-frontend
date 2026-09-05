"use client";

import { useState } from "react";
import { PlusIcon, TrashIcon } from "lucide-react";

import { DetailSection } from "@/components/detail-shell";
import { LocaleTabs } from "@/components/locale-tabs";
import { TagInput } from "@/components/tag-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/locale";
import { CHANGELOG_TYPES, type ChangelogType } from "@/features/changelog/params";
import type {
  ChangelogDetail,
  ChangelogTranslationInput,
} from "@/features/changelog/service/changelog.service";

export interface ChangelogFormValues {
  entryDate: string;
  version: string;
  type: ChangelogType;
  translations: Record<Locale, ChangelogTranslationInput>;
}

function emptyTranslation(): ChangelogTranslationInput {
  return { title: "", excerpt: "", bullets: [], sections: [] };
}

export function initialValues(entry?: ChangelogDetail): ChangelogFormValues {
  const translations = Object.fromEntries(
    LOCALES.map((locale) => {
      const found = entry?.translations.find(
        (translation) => translation.locale === locale,
      );
      return [
        locale,
        found
          ? {
              title: found.title,
              excerpt: found.excerpt,
              bullets: found.bullets,
              sections: found.sections,
            }
          : emptyTranslation(),
      ];
    }),
  ) as Record<Locale, ChangelogTranslationInput>;

  return {
    // A new entry defaults to today, in UTC — the same calendar day the backend
    // stores and the timeline groups on.
    entryDate: entry?.entryDate ?? new Date().toISOString().slice(0, 10),
    version: entry?.version ?? "",
    type: (entry?.type as ChangelogType) ?? "Release",
    translations,
  };
}

/** Title and excerpt are both required by the backend, so both must be present. */
export function isFilled(translation: ChangelogTranslationInput): boolean {
  return (
    translation.title.trim().length > 0 && translation.excerpt.trim().length > 0
  );
}

export function toPayload(
  translation: ChangelogTranslationInput,
): ChangelogTranslationInput {
  return {
    title: translation.title.trim(),
    excerpt: translation.excerpt.trim(),
    bullets: translation.bullets.filter((bullet) => bullet.trim().length > 0),
    // The backend rejects a section with an empty heading or body, so a half
    // written block is dropped rather than failing the whole save.
    sections: translation.sections
      .filter(
        (section) => section.heading.trim() && section.body.trim(),
      )
      .map((section) => ({
        heading: section.heading.trim(),
        body: section.body.trim(),
        ...(section.bullets?.length
          ? { bullets: section.bullets.filter((bullet) => bullet.trim()) }
          : {}),
      })),
  };
}

export function ChangelogForm({
  values,
  onChange,
  disabled,
}: {
  values: ChangelogFormValues;
  onChange: (values: ChangelogFormValues) => void;
  disabled?: boolean;
}) {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const translation = values.translations[locale];

  const patchTranslation = (patch: Partial<ChangelogTranslationInput>) =>
    onChange({
      ...values,
      translations: {
        ...values.translations,
        [locale]: { ...translation, ...patch },
      },
    });

  const patchSection = (index: number, patch: Partial<{ heading: string; body: string; bullets: string[] }>) =>
    patchTranslation({
      sections: translation.sections.map((section, current) =>
        current === index ? { ...section, ...patch } : section,
      ),
    });

  return (
    <>
      <DetailSection
        title="Entry"
        description="Locale-independent fields. The date is a calendar day — the timeline groups on it, so it must not shift with a reader's timezone."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="entryDate">Date</Label>
            <Input
              id="entryDate"
              type="date"
              value={values.entryDate}
              disabled={disabled}
              onChange={(event) =>
                onChange({ ...values, entryDate: event.target.value })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={values.type}
              onValueChange={(value) =>
                onChange({ ...values, type: value as ChangelogType })
              }
            >
              <SelectTrigger id="type" disabled={disabled}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANGELOG_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="version">Version</Label>
            <Input
              id="version"
              value={values.version}
              disabled={disabled}
              placeholder="v0.3.0 — optional"
              onChange={(event) =>
                onChange({ ...values, version: event.target.value })
              }
            />
          </div>
        </div>
      </DetailSection>

      <DetailSection
        title="Copy"
        description="The title and excerpt are what the compact strip shows. Sections are the expanded entry on /changelog."
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
                  rows={3}
                  value={translation.excerpt}
                  disabled={disabled}
                  onChange={(event) =>
                    patchTranslation({ excerpt: event.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bullets">Highlights</Label>
                <TagInput
                  id="bullets"
                  value={translation.bullets}
                  disabled={disabled}
                  placeholder="Comma separated, e.g. Faster retrieval, New model"
                  onChange={(bullets) => patchTranslation({ bullets })}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Sections</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    onClick={() =>
                      patchTranslation({
                        sections: [
                          ...translation.sections,
                          { heading: "", body: "", bullets: [] },
                        ],
                      })
                    }
                  >
                    <PlusIcon className="size-4" />
                    Add section
                  </Button>
                </div>

                {translation.sections.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No sections. The entry renders as its title and excerpt alone.
                  </p>
                )}

                {translation.sections.map((section, index) => (
                  <div key={index} className="space-y-3 rounded-md border p-3">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Heading"
                        value={section.heading}
                        disabled={disabled}
                        onChange={(event) =>
                          patchSection(index, { heading: event.target.value })
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={disabled}
                        onClick={() =>
                          patchTranslation({
                            sections: translation.sections.filter(
                              (_section, current) => current !== index,
                            ),
                          })
                        }
                      >
                        <TrashIcon className="size-4" />
                        <span className="sr-only">Remove section</span>
                      </Button>
                    </div>
                    <Textarea
                      rows={3}
                      placeholder="Body"
                      value={section.body}
                      disabled={disabled}
                      onChange={(event) =>
                        patchSection(index, { body: event.target.value })
                      }
                    />
                    <TagInput
                      value={section.bullets ?? []}
                      disabled={disabled}
                      placeholder="Section bullets, comma separated"
                      onChange={(bullets) => patchSection(index, { bullets })}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </LocaleTabs>
      </DetailSection>
    </>
  );
}
