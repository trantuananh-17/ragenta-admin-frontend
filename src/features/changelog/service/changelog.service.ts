import { z } from "zod";

import { contentApi } from "@/lib/ky-content";
import { LOCALES } from "@/lib/locale";
import { pageSchema, toOffset } from "@/lib/pagination";
import { CHANGELOG_TYPES, type ChangelogParams } from "../params";

/**
 * Release notes on `/changelog`, and the compact strip on the home and product
 * pages.
 *
 * `entryDate` is a calendar day (`YYYY-MM-DD`), not an instant: the timeline
 * groups on the date a reader sees, which must not shift with their timezone.
 */
export const changelogSectionSchema = z.object({
  heading: z.string(),
  body: z.string(),
  bullets: z.array(z.string()).optional(),
});

export const changelogRowSchema = z.object({
  id: z.string(),
  entryDate: z.string(),
  version: z.string().nullable(),
  type: z.string(),
  status: z.string(),
  createdAt: z.coerce.string(),
  updatedAt: z.coerce.string(),
});

export const changelogTranslationSchema = z.object({
  entryId: z.string(),
  locale: z.enum(LOCALES),
  title: z.string(),
  excerpt: z.string(),
  bullets: z.array(z.string()),
  sections: z.array(changelogSectionSchema),
  createdAt: z.coerce.string(),
  updatedAt: z.coerce.string(),
});

export const changelogDetailSchema = changelogRowSchema.extend({
  translations: z.array(changelogTranslationSchema),
});

export const changelogPageSchema = pageSchema(changelogRowSchema);
const entryEnvelopeSchema = z.object({ entry: changelogDetailSchema });

export type ChangelogSection = z.infer<typeof changelogSectionSchema>;
export type ChangelogRow = z.infer<typeof changelogRowSchema>;
export type ChangelogDetail = z.infer<typeof changelogDetailSchema>;

export interface ChangelogTranslationInput {
  title: string;
  excerpt: string;
  bullets: string[];
  sections: ChangelogSection[];
}

export interface CreateChangelogInput {
  entryDate: string;
  version?: string | null;
  type: (typeof CHANGELOG_TYPES)[number];
  translations: {
    en: ChangelogTranslationInput;
    vi?: ChangelogTranslationInput;
  };
}

export interface UpdateChangelogInput {
  entryDate?: string;
  version?: string | null;
  type?: (typeof CHANGELOG_TYPES)[number];
  translations?: {
    en?: ChangelogTranslationInput;
    vi?: ChangelogTranslationInput;
  };
}

export async function getChangelogEntries(params: ChangelogParams) {
  const searchParams: Record<string, string | number> = {
    limit: params.limit,
    offset: toOffset(params.page, params.limit),
  };
  if (params.status) searchParams.status = params.status;

  const response = await contentApi.get("admin/changelog", { searchParams });
  return changelogPageSchema.parse(await response.json());
}

export async function getChangelogEntry(id: string): Promise<ChangelogDetail> {
  const response = await contentApi.get(`admin/changelog/${id}`);
  return entryEnvelopeSchema.parse(await response.json()).entry;
}

export async function createChangelogEntry(
  input: CreateChangelogInput,
): Promise<ChangelogDetail> {
  const response = await contentApi.post("admin/changelog", { json: input });
  return entryEnvelopeSchema.parse(await response.json()).entry;
}

export async function updateChangelogEntry(
  id: string,
  input: UpdateChangelogInput,
): Promise<ChangelogDetail> {
  const response = await contentApi.patch(`admin/changelog/${id}`, {
    json: input,
  });
  return entryEnvelopeSchema.parse(await response.json()).entry;
}

export async function publishChangelogEntry(id: string) {
  const response = await contentApi.post(`admin/changelog/${id}/publish`);
  return entryEnvelopeSchema.parse(await response.json()).entry;
}

export async function unpublishChangelogEntry(id: string) {
  const response = await contentApi.post(`admin/changelog/${id}/unpublish`);
  return entryEnvelopeSchema.parse(await response.json()).entry;
}

export async function deleteChangelogEntry(id: string): Promise<void> {
  await contentApi.delete(`admin/changelog/${id}`);
}
