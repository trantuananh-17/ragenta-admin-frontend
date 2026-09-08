import "server-only";

import { getQueryClient } from "@/lib/get-query-client";
import { oauthAppsOptions } from "../options/oauth-apps.options";

export async function prefetchOAuthProviders() {
  await getQueryClient().prefetchQuery(oauthAppsOptions.list());
}
