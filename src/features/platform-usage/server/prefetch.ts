import "server-only";

import { getQueryClient } from "@/lib/get-query-client";
import { platformUsageOptions } from "../options/platform-usage.options";
import type { PlatformUsageParams } from "../service/platform-usage.service";

/** Warms the server QueryClient so the first paint needs no client fetch. */
export async function prefetchPlatformUsage(params: PlatformUsageParams) {
  await getQueryClient().prefetchQuery(platformUsageOptions.range(params));
}
