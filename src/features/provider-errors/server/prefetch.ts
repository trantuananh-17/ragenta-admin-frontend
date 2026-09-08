import "server-only";

import { getQueryClient } from "@/lib/get-query-client";
import { providerErrorOptions } from "../options/provider-errors.options";

export async function prefetchProviderErrors() {
  await getQueryClient().prefetchQuery(providerErrorOptions.range({ days: 7 }));
}
