import "server-only";

import { getQueryClient } from "@/lib/get-query-client";
import { paymentsOptions } from "../options/payments.options";
import type { PaymentsParams } from "../service/payments.service";

/** Warms the server QueryClient so the first paint needs no client fetch. */
export async function prefetchPayments(params: PaymentsParams) {
  await getQueryClient().prefetchQuery(paymentsOptions.list(params));
}
