import "server-only";

import { getQueryClient } from "@/lib/get-query-client";
import { revenueOptions } from "../options/revenue.options";
import type { RevenueParams } from "../service/revenue.service";

/** Warms the server QueryClient so the first paint needs no client fetch. */
export async function prefetchRevenue(params: RevenueParams) {
  await getQueryClient().prefetchQuery(revenueOptions.range(params));
}
