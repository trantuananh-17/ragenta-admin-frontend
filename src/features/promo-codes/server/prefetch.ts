import "server-only";

import { getQueryClient } from "@/lib/get-query-client";
import { promoCodesOptions } from "../options/promo-codes.options";

export async function prefetchPromoCodes() {
  await getQueryClient().prefetchQuery(promoCodesOptions.list());
}
