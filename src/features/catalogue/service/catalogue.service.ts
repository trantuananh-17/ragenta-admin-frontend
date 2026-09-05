import { z } from "zod";

import { contentApi } from "@/lib/ky-content";
import {
  localizedListSchema,
  localizedTextSchema,
  type LocalizedList,
  type LocalizedText,
} from "@/lib/locale";
import { pagedSchema } from "@/lib/pagination";
import type { CatalogueParams } from "../params";

/**
 * The models, tools and connectors shown in the landing page's "Models and
 * tools" section.
 *
 * `name` is not translated on purpose: `Claude Opus 4.5` and `bge-m3` are
 * product names, not copy. Description and tags are one localized column each
 * rather than a translation table, because they are short and always read
 * together.
 */
export const catalogueItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: localizedTextSchema,
  tags: localizedListSchema,
  featured: z.boolean(),
  sortOrder: z.number(),
  status: z.string(),
  createdAt: z.coerce.string(),
  updatedAt: z.coerce.string(),
});

export const cataloguePageSchema = pagedSchema(catalogueItemSchema);
const itemEnvelopeSchema = z.object({ item: catalogueItemSchema });

export type CatalogueItem = z.infer<typeof catalogueItemSchema>;

export interface CreateCatalogueItemInput {
  name: string;
  slug?: string;
  description: LocalizedText;
  tags: LocalizedList;
  featured: boolean;
  sortOrder: number;
  status: string;
}

export type UpdateCatalogueItemInput = Partial<
  Omit<CreateCatalogueItemInput, "slug">
>;

export async function getCatalogue(params: CatalogueParams) {
  const searchParams: Record<string, string | number> = {
    page: params.page,
    limit: params.limit,
  };
  if (params.search) searchParams.search = params.search;
  if (params.status) searchParams.status = params.status;

  const response = await contentApi.get("admin/catalogue", { searchParams });
  return cataloguePageSchema.parse(await response.json());
}

export async function getCatalogueItem(id: string): Promise<CatalogueItem> {
  const response = await contentApi.get(`admin/catalogue/${id}`);
  return itemEnvelopeSchema.parse(await response.json()).item;
}

export async function createCatalogueItem(
  input: CreateCatalogueItemInput,
): Promise<CatalogueItem> {
  const response = await contentApi.post("admin/catalogue", { json: input });
  return itemEnvelopeSchema.parse(await response.json()).item;
}

export async function updateCatalogueItem(
  id: string,
  input: UpdateCatalogueItemInput,
): Promise<CatalogueItem> {
  const response = await contentApi.patch(`admin/catalogue/${id}`, {
    json: input,
  });
  return itemEnvelopeSchema.parse(await response.json()).item;
}

export async function deleteCatalogueItem(id: string): Promise<void> {
  await contentApi.delete(`admin/catalogue/${id}`);
}
