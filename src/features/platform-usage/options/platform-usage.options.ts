import { queryOptions } from "@tanstack/react-query";

import { getPlatformUsage, type PlatformUsageParams } from "../service/platform-usage.service";

export const platformUsageKeys = {
  all: () => ["platform-usage"] as const,
  range: (params: PlatformUsageParams) => [...platformUsageKeys.all(), params] as const,
};

export const platformUsageOptions = {
  range: (params: PlatformUsageParams) =>
    queryOptions({
      queryKey: platformUsageKeys.range(params),
      queryFn: () => getPlatformUsage(params),
    }),
};
