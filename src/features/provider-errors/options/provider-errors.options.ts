import { queryOptions } from "@tanstack/react-query";

import {
  getProviderErrors,
  type ProviderErrorsParams,
} from "../service/provider-errors.service";

export const providerErrorKeys = {
  all: () => ["provider-errors"] as const,
  range: (params: ProviderErrorsParams) =>
    [...providerErrorKeys.all(), params] as const,
};

export const providerErrorOptions = {
  range: (params: ProviderErrorsParams) =>
    queryOptions({
      queryKey: providerErrorKeys.range(params),
      queryFn: () => getProviderErrors(params),
    }),
};
