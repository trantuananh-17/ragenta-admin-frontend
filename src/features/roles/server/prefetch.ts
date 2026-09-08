import "server-only";

import { getQueryClient } from "@/lib/get-query-client";
import { rolesOptions } from "../options/roles.options";

/** Warms the server QueryClient so the first paint needs no client fetch. */
export async function prefetchRoles() {
  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(rolesOptions.list()),
    queryClient.prefetchQuery(rolesOptions.permissions()),
  ]);
}
