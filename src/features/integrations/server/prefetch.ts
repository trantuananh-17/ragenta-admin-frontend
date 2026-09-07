import "server-only";

import { getQueryClient } from "@/lib/get-query-client";
import { integrationsOptions } from "../options/integrations.options";

export async function prefetchIntegrations() {
  await getQueryClient().prefetchQuery(integrationsOptions.list());
}
