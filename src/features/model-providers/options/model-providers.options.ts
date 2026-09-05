import { queryOptions } from "@tanstack/react-query";

import {
  getPlatformDefaults,
  listProviders,
} from "../service/model-providers.service";

export const modelProvidersKeys = {
  all: () => ["model-providers"] as const,
  providers: () => [...modelProvidersKeys.all(), "providers"] as const,
  defaults: () => [...modelProvidersKeys.all(), "defaults"] as const,
};

export const modelProvidersOptions = {
  list: () =>
    queryOptions({
      queryKey: modelProvidersKeys.providers(),
      queryFn: listProviders,
    }),
  defaults: () =>
    queryOptions({
      queryKey: modelProvidersKeys.defaults(),
      queryFn: getPlatformDefaults,
    }),
};
