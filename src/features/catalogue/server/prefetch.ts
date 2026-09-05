import "server-only";

import { getQueryClient } from "@/lib/get-query-client";
import { catalogueOptions } from "../options/catalogue.options";
import type { CatalogueParams } from "../params";

export async function prefetchCatalogue(params: CatalogueParams) {
  await getQueryClient().prefetchQuery(catalogueOptions.list(params));
}

export async function prefetchCatalogueItem(id: string) {
  await getQueryClient().prefetchQuery(catalogueOptions.detail(id));
}
