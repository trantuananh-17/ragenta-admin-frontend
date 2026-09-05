import { queryOptions } from "@tanstack/react-query";

import { getDashboardOverview } from "../service/dashboard.service";

export const dashboardKeys = {
  all: () => ["dashboard"] as const,
};

export const dashboardOptions = {
  overview: () =>
    queryOptions({
      queryKey: dashboardKeys.all(),
      queryFn: getDashboardOverview,
    }),
};
