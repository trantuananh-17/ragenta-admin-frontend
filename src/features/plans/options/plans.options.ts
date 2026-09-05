import { queryOptions } from "@tanstack/react-query";

import { getPlans } from "../service/plans.service";

export const plansKeys = {
  all: () => ["plans"] as const,
};

export const plansOptions = {
  list: () =>
    queryOptions({
      queryKey: plansKeys.all(),
      queryFn: getPlans,
      // The catalogue only moves on a backend release.
      staleTime: 10 * 60 * 1000,
    }),
};
