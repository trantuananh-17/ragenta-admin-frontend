"use client";

import { useState } from "react";
import { ExternalLinkIcon } from "lucide-react";
import { toast } from "sonner";

import { DetailSection, DetailShell } from "@/components/detail-shell";
import { LocaleTabs } from "@/components/locale-tabs";
import { MarkdownPreview } from "@/components/markdown-preview";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useLegalDocumentSuspense,
  usePutLegalDocument,
} from "@/features/legal/hooks/legal.hook";
import {
  LEGAL_TITLES,
  type LegalSlug,
} from "@/features/legal/service/legal.service";
import { siteBaseUrl } from "@/lib/config";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/locale";

type Values = Record<Locale, { title: string; bodyMd: string }>;

export function LegalEditor({ slug }: { slug: LegalSlug }) {
  const { data: document } = useLegalDocumentSuspense(slug);
  const save = usePutLegalDocument(slug);

  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [showPreview, setShowPreview] = useState(false);
  const [values, setValues] = useState<Values>(() => {
    return Object.fromEntries(
      LOCALES.map((entry) => {
        const translation = document?.translations.find(
          (candidate) => candidate.locale === entry,
        );
        return [
          entry,
          {
            title: translation?.title ?? "",
            bodyMd: translation?.bodyMd ?? "",
          },
        ];
      }),
    ) as Values;
  });

  const current = values[locale];

  const patch = (fields: Partial<{ title: string; bodyMd: string }>) =>
    setValues((state) => ({ ...state, [locale]: { ...state[locale], ...fields } }));

  const filled = (entry: Locale) =>
    values[entry].title.trim().length > 0 && values[entry].bodyMd.trim().length > 0;

  const submit = () => {
    if (!filled("en")) {
      toast.error("English is required", {
        description:
          "A legal page that renders blank is worse than one that renders in English.",
      });
      return;
    }

    save.mutate({
      translations: {
        en: {
          title: values.en.title.trim(),
          bodyMd: values.en.bodyMd,
        },
        ...(filled("vi")
          ? { vi: { title: values.vi.title.trim(), bodyMd: values.vi.bodyMd } }
          : {}),
      },
    });
  };

  return (
    <DetailShell>
      <PageHeader
        back={{ href: "/admin/content/legal", label: "Legal documents" }}
        title={LEGAL_TITLES[slug]}
        description={
          <span className="font-mono text-xs">
            {slug}
            {!document && " · never written"}
          </span>
        }
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <a
                href={`${siteBaseUrl()}/en/${slug}`}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLinkIcon className="size-4" />
                View live
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview((value) => !value)}
            >
              {showPreview ? "Hide preview" : "Preview"}
            </Button>
            <Button size="sm" onClick={submit} disabled={save.isPending}>
              {save.isPending ? "Saving..." : "Save"}
            </Button>
          </>
        }
      />

      <DetailSection
        title="Document"
        description="A save replaces the document whole and moves its Last updated date. That date belongs to the document, not to a locale — translating a day later must not make the Vietnamese page look newer than the English one it came from."
      >
        <LocaleTabs
          locale={locale}
          onLocaleChange={setLocale}
          filled={{ en: filled("en"), vi: filled("vi") }}
        >
          {() => (
            <>
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={current.title}
                  disabled={save.isPending}
                  onChange={(event) => patch({ title: event.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bodyMd">Body (Markdown)</Label>
                <Textarea
                  id="bodyMd"
                  rows={24}
                  className="font-mono text-xs"
                  value={current.bodyMd}
                  disabled={save.isPending}
                  onChange={(event) => patch({ bodyMd: event.target.value })}
                />
              </div>

              {showPreview && (
                <div className="rounded-md border bg-muted/30 p-4">
                  <MarkdownPreview source={current.bodyMd} />
                </div>
              )}
            </>
          )}
        </LocaleTabs>
      </DetailSection>
    </DetailShell>
  );
}
