"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { paymentsOptions } from "../options/payments.options";
import type { PaymentsParams } from "../service/payments.service";

export function usePaymentsSuspense(params: PaymentsParams) {
  return useSuspenseQuery(paymentsOptions.list(params));
}
