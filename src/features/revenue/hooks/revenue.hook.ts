"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { revenueOptions } from "../options/revenue.options";
import type { RevenueParams } from "../service/revenue.service";

export function useRevenueSuspense(params: RevenueParams) {
  return useSuspenseQuery(revenueOptions.range(params));
}
