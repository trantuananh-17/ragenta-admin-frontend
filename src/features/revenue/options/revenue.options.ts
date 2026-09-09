import { queryOptions } from "@tanstack/react-query";

import { getRevenue, type RevenueParams } from "../service/revenue.service";

export const revenueKeys = {
  all: () => ["revenue"] as const,
  range: (params: RevenueParams) => [...revenueKeys.all(), params] as const,
};

export const revenueOptions = {
  range: (params: RevenueParams) =>
    queryOptions({
      queryKey: revenueKeys.range(params),
      queryFn: () => getRevenue(params),
    }),
};
