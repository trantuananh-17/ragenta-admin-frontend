"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { platformUsageOptions } from "../options/platform-usage.options";
import type { PlatformUsageParams } from "../service/platform-usage.service";

export function usePlatformUsageSuspense(params: PlatformUsageParams) {
  return useSuspenseQuery(platformUsageOptions.range(params));
}
