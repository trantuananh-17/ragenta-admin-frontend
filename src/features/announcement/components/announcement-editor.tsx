"use client";

import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { DetailSection, DetailShell } from "@/components/detail-shell";
import { EntityStateView } from "@/components/entity-components";
import { LocaleTabs } from "@/components/locale-tabs";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useAnnouncementSuspense,
  usePutAnnouncement,
} from "@/features/announcement/hooks/announcement.hook";
import { formatDateTime } from "@/lib/format";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/locale";

type TextField = "badge" | "fullText" | "shortText";

type Values = {
  enabled: boolean;
  linkUrl: string;
} & Record<TextField, Record<Locale, string>>;

const TEXT_FIELDS: { key: TextField; label: string; hint: string }[] = [
  { key: "badge", label: "Badge", hint: "The pill at the start of the bar." },
  { key: "fullText", label: "Full text", hint: "Shown on wide screens." },
  {
    key: "shortText",
    label: "Short text",
    hint: "Shown instead of the full text on narrow screens.",
  },
];

export function AnnouncementEditor() {
  const { data: announcement } = useAnnouncementSuspense();
  const save = usePutAnnouncement();
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);

  const [values, setValues] = useState<Values>(() => {
    const byLocale = (field: TextField) =>
      Object.fromEntries(
        LOCALES.map((entry) => [entry, announcement[field]?.[entry] ?? ""]),
      ) as Record<Locale, string>;

    return {
      enabled: announcement.enabled,
      linkUrl: announcement.linkUrl,
      badge: byLocale("badge"),
      fullText: byLocale("fullText"),
      shortText: byLocale("shortText"),
    };
  });

  const patchText = (field: TextField, value: string) =>
    setValues((current) => ({
      ...current,
      [field]: { ...current[field], [locale]: value },
    }));

  const submit = () => {
    const missing = TEXT_FIELDS.filter(
      (field) => !values[field.key].en.trim(),
    ).map((field) => field.label);

    if (missing.length > 0) {
      toast.error("English copy is required", {
        description: `Still empty: ${missing.join(", ")}.`,
      });
      return;
    }

    const localized = (field: TextField) => ({
      en: values[field].en.trim(),
      ...(values[field].vi.trim() ? { vi: values[field].vi.trim() } : {}),
    });

    save.mutate({
      enabled: values.enabled,
      linkUrl: values.linkUrl.trim(),
      badge: localized("badge"),
      fullText: localized("fullText"),
      shortText: localized("shortText"),
    });
  };

  return (
    <DetailShell>
      <PageHeader
        title="Announcement bar"
        description="The strip above the site's navigation. One banner, replaced whole on every save."
        badges={
          <>
            {values.enabled ? (
              <StatusBadge tone="success">enabled</StatusBadge>
            ) : (
              <StatusBadge>off</StatusBadge>
            )}
            {announcement.updatedAt && (
              <span className="text-xs text-muted-foreground">
                last saved {formatDateTime(announcement.updatedAt)}
              </span>
            )}
          </>
        }
        actions={
          <Button onClick={submit} disabled={save.isPending}>
            {save.isPending ? "Saving..." : "Save"}
          </Button>
        }
      />

      <DetailSection title="Bar">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              id="enabled"
              checked={values.enabled}
              disabled={save.isPending}
              onCheckedChange={(enabled) =>
                setValues((current) => ({ ...current, enabled }))
              }
            />
            <Label htmlFor="enabled" className="font-normal">
              Show the bar on the site
            </Label>
          </div>

          <div className="grid max-w-md gap-2">
            <Label htmlFor="linkUrl">Link</Label>
            <Input
              id="linkUrl"
              value={values.linkUrl}
              disabled={save.isPending}
              placeholder="/pricing"
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  linkUrl: event.target.value,
                }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Locale-independent. An internal path is prefixed with the reader&apos;s
              locale by the site; an absolute URL is used as-is.
            </p>
          </div>
        </div>
      </DetailSection>

      <DetailSection
        title="Copy"
        description="English is required for all three. Vietnamese falls back to it."
      >
        <LocaleTabs
          locale={locale}
          onLocaleChange={setLocale}
          filled={{
            en: TEXT_FIELDS.every((field) => values[field.key].en.trim()),
            vi: TEXT_FIELDS.every((field) => values[field.key].vi.trim()),
          }}
        >
          {() => (
            <>
              {TEXT_FIELDS.map((field) => (
                <div key={field.key} className="grid gap-2">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <Input
                    id={field.key}
                    value={values[field.key][locale]}
                    disabled={save.isPending}
                    onChange={(event) => patchText(field.key, event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">{field.hint}</p>
                </div>
              ))}
            </>
          )}
        </LocaleTabs>
      </DetailSection>
    </DetailShell>
  );
}

export function AnnouncementLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export function AnnouncementError() {
  return (
    <EntityStateView
      icon={<AlertCircle className="size-8 text-destructive" />}
      title="Could not load the announcement"
      message="The content backend refused or is unreachable."
    />
  );
}
