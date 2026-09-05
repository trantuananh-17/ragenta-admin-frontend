import { z } from "zod";

/**
 * Mirrors `ragenta-content-backend/src/shared/locale.ts`. Adding a locale means
 * adding it there, here, and in `ragenta-landing-page` in the same change.
 *
 * `en` is the fallback every other locale resolves through, which is why every
 * write schema in the content features requires it and none require `vi`.
 */
export const LOCALES = ["en", "vi"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  vi: "Tiếng Việt",
};

export const localizedTextSchema = z.object({
  en: z.string(),
  vi: z.string().optional().nullable(),
});

export const localizedListSchema = z.object({
  en: z.array(z.string()),
  vi: z.array(z.string()).optional().nullable(),
});

export type LocalizedText = z.infer<typeof localizedTextSchema>;
export type LocalizedList = z.infer<typeof localizedListSchema>;

/** What the site would show for a locale, used for list previews. */
export function pickText(
  value: LocalizedText | null | undefined,
  locale: Locale,
): string {
  if (!value) return "";
  return value[locale] || value[DEFAULT_LOCALE] || "";
}

/** Which locales a row actually has copy for — the "EN VI" chips in the tables. */
export function translatedLocales(
  translations: { locale: string }[] | undefined,
): Locale[] {
  if (!translations) return [];
  return LOCALES.filter((locale) =>
    translations.some((translation) => translation.locale === locale),
  );
}
