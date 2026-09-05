"use client";

import { StatusBadge } from "@/components/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/locale";

/**
 * The editing surface for anything the marketing site renders in more than one
 * language.
 *
 * English is marked required everywhere because the backend treats it as the
 * fallback every other locale resolves through — a post that exists only in
 * Vietnamese renders an empty card on the English index rather than being absent
 * from it, so nothing publishes without it.
 */
export function LocaleTabs({
  locale,
  onLocaleChange,
  filled,
  children,
}: {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  /** Locales that currently have copy, so an empty translation is visible. */
  filled: Partial<Record<Locale, boolean>>;
  children: (locale: Locale) => React.ReactNode;
}) {
  return (
    <Tabs
      value={locale}
      onValueChange={(value) => onLocaleChange(value as Locale)}
    >
      <TabsList>
        {LOCALES.map((entry) => (
          <TabsTrigger key={entry} value={entry} className="gap-2">
            {LOCALE_LABELS[entry]}
            {entry === "en" ? (
              <StatusBadge tone="info" className="text-[10px]">
                required
              </StatusBadge>
            ) : (
              !filled[entry] && (
                <StatusBadge className="text-[10px]">empty</StatusBadge>
              )
            )}
          </TabsTrigger>
        ))}
      </TabsList>

      {LOCALES.map((entry) => (
        <TabsContent key={entry} value={entry} className="mt-4 space-y-4">
          {children(entry)}
        </TabsContent>
      ))}
    </Tabs>
  );
}

/** The "EN VI" chips the content tables show, so gaps are visible in a list. */
export function LocaleChips({ locales }: { locales: Locale[] }) {
  return (
    <div className="flex gap-1">
      {LOCALES.map((locale) => (
        <StatusBadge
          key={locale}
          tone={locales.includes(locale) ? "success" : "neutral"}
          className="text-[10px] uppercase"
        >
          {locale}
        </StatusBadge>
      ))}
    </div>
  );
}
