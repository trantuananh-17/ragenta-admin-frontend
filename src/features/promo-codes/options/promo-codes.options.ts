import { queryOptions } from "@tanstack/react-query";

import {
  listPromoCodes,
  listPromoRedemptions,
} from "../service/promo-codes.service";

export const promoCodesKeys = {
  all: () => ["promo-codes"] as const,
  list: () => [...promoCodesKeys.all(), "list"] as const,
  redemptions: (promoCodeId: string) =>
    [...promoCodesKeys.all(), "redemptions", promoCodeId] as const,
};

export const promoCodesOptions = {
  list: () =>
    queryOptions({
      queryKey: promoCodesKeys.list(),
      queryFn: () => listPromoCodes(),
    }),

  /**
   * Fetched when a row is opened rather than with the list: a code handed out at
   * a conference can have thousands of redemptions, and none of them are on
   * screen until somebody asks.
   */
  redemptions: (promoCodeId: string) =>
    queryOptions({
      queryKey: promoCodesKeys.redemptions(promoCodeId),
      queryFn: () => listPromoRedemptions(promoCodeId),
    }),
};
