import "server-only";

import { getQueryClient } from "@/lib/get-query-client";
import { plansOptions } from "../options/plans.options";

export async function prefetchPlans() {
  await getQueryClient().prefetchQuery(plansOptions.list());
}
