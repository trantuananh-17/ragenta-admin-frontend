import { queryOptions } from "@tanstack/react-query";

import {
  getLegalDocument,
  getLegalDocuments,
  type LegalSlug,
} from "../service/legal.service";

export const legalKeys = {
  all: () => ["legal"] as const,
  list: () => [...legalKeys.all(), "list"] as const,
  detail: (slug: LegalSlug) => [...legalKeys.all(), "detail", slug] as const,
};

export const legalOptions = {
  list: () =>
    queryOptions({
      queryKey: legalKeys.list(),
      queryFn: getLegalDocuments,
    }),
  detail: (slug: LegalSlug) =>
    queryOptions({
      queryKey: legalKeys.detail(slug),
      queryFn: () => getLegalDocument(slug),
    }),
};
