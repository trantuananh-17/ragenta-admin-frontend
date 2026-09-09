import { queryOptions } from "@tanstack/react-query";

import { getPayments, type PaymentsParams } from "../service/payments.service";

export const paymentsKeys = {
  all: () => ["payments"] as const,
  list: (params: PaymentsParams) => [...paymentsKeys.all(), "list", params] as const,
};

export const paymentsOptions = {
  list: (params: PaymentsParams) =>
    queryOptions({
      queryKey: paymentsKeys.list(params),
      queryFn: () => getPayments(params),
      // Keeps the page on screen while the next one loads, so paging does not
      // blank the table it is paging.
      placeholderData: (previous) => previous,
    }),
};
