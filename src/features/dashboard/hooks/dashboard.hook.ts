"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { dashboardOptions } from "../options/dashboard.options";

export function useDashboardSuspense() {
  return useSuspenseQuery(dashboardOptions.overview());
}
