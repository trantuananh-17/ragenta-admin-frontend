"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { plansOptions } from "../options/plans.options";

export function usePlansSuspense() {
  return useSuspenseQuery(plansOptions.list());
}
