import "server-only";

import { getQueryClient } from "@/lib/get-query-client";
import { usersOptions } from "../options/users.options";
import type { UsersParams } from "../params";

/** Warms the server QueryClient so the first paint needs no client fetch. */
export async function prefetchUsers(params: UsersParams) {
  await getQueryClient().prefetchQuery(usersOptions.list(params));
}
