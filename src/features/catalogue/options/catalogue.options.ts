import { queryOptions } from "@tanstack/react-query";

import { getCatalogue, getCatalogueItem } from "../service/catalogue.service";
import type { CatalogueParams } from "../params";

export const catalogueKeys = {
  all: () => ["catalogue"] as const,
  list: (params: CatalogueParams) =>
    [...catalogueKeys.all(), "list", params] as const,
  detail: (id: string) => [...catalogueKeys.all(), "detail", id] as const,
};

export const catalogueOptions = {
  list: (params: CatalogueParams) =>
    queryOptions({
      queryKey: catalogueKeys.list(params),
      queryFn: () => getCatalogue(params),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: catalogueKeys.detail(id),
      queryFn: () => getCatalogueItem(id),
    }),
};
