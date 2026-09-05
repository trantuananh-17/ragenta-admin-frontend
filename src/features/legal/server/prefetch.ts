import "server-only";

import { getQueryClient } from "@/lib/get-query-client";
import { legalOptions } from "../options/legal.options";
import type { LegalSlug } from "../service/legal.service";

export async function prefetchLegalDocuments() {
  await getQueryClient().prefetchQuery(legalOptions.list());
}

export async function prefetchLegalDocument(slug: LegalSlug) {
  await getQueryClient().prefetchQuery(legalOptions.detail(slug));
}
