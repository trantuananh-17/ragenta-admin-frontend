import "server-only";

import { getQueryClient } from "@/lib/get-query-client";
import { modelProvidersOptions } from "../options/model-providers.options";

export async function prefetchModelProviders() {
  await getQueryClient().prefetchQuery(modelProvidersOptions.list());
}
