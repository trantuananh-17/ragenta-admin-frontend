import "server-only";

import { getQueryClient } from "@/lib/get-query-client";
import { dashboardOptions } from "../options/dashboard.options";

export async function prefetchDashboard() {
  await getQueryClient().prefetchQuery(dashboardOptions.overview());
}
