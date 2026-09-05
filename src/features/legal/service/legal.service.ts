import { HTTPError } from "ky";
import { z } from "zod";

import { contentApi } from "@/lib/ky-content";
import { LOCALES } from "@/lib/locale";

/**
 * Privacy policy and terms of service.
 *
 * The slug set is closed: each document has a page routed to it on the site, so
 * creating one is a code change on both sides, not an admin action. The admin
 * API upserts by slug and never creates a new one.
 */
export const LEGAL_SLUGS = ["privacy-policy", "terms-of-service"] as const;
export type LegalSlug = (typeof LEGAL_SLUGS)[number];

export const LEGAL_TITLES: Record<LegalSlug, string> = {
  "privacy-policy": "Privacy policy",
  "terms-of-service": "Terms of service",
};

export const legalDocumentRowSchema = z.object({
  slug: z.string(),
  createdAt: z.coerce.string(),
  updatedAt: z.coerce.string(),
});

export const legalTranslationSchema = z.object({
  slug: z.string(),
  locale: z.enum(LOCALES),
  title: z.string(),
  bodyMd: z.string(),
  createdAt: z.coerce.string(),
  updatedAt: z.coerce.string(),
});

const listSchema = z.object({ documents: z.array(legalDocumentRowSchema) });
const detailSchema = z.object({
  document: z.object({
    slug: z.string(),
    translations: z.array(legalTranslationSchema),
  }),
});

export type LegalDocumentRow = z.infer<typeof legalDocumentRowSchema>;
export type LegalDocument = z.infer<typeof detailSchema>["document"];

export interface LegalTranslationInput {
  title: string;
  bodyMd: string;
}

export interface PutLegalDocumentInput {
  translations: { en: LegalTranslationInput; vi?: LegalTranslationInput };
}

export async function getLegalDocuments(): Promise<LegalDocumentRow[]> {
  const response = await contentApi.get("admin/legal");
  return listSchema.parse(await response.json()).documents;
}

/**
 * Answers `null` rather than throwing when the document has never been written.
 * That is the normal state of a fresh environment — the site falls back to its
 * own copy — and the editor should open blank instead of showing an error.
 */
export async function getLegalDocument(
  slug: LegalSlug,
): Promise<LegalDocument | null> {
  try {
    const response = await contentApi.get(`admin/legal/${slug}`);
    return detailSchema.parse(await response.json()).document;
  } catch (error) {
    if (error instanceof HTTPError && error.response.status === 404) return null;
    throw error;
  }
}

export async function putLegalDocument(
  slug: LegalSlug,
  input: PutLegalDocumentInput,
): Promise<LegalDocument> {
  const response = await contentApi.put(`admin/legal/${slug}`, { json: input });
  return detailSchema.parse(await response.json()).document;
}
