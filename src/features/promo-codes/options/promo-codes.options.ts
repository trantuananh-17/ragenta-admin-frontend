import { queryOptions } from "@tanstack/react-query";

import { listPromoCodes } from "../service/promo-codes.service";

export const promoCodesKeys = {
  all: () => ["promo-codes"] as const,
};

export const promoCodesOptions = {
  list: () =>
    queryOptions({
      queryKey: promoCodesKeys.all(),
      queryFn: listPromoCodes,
    }),
};
