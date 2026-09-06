import { queryOptions } from "@tanstack/react-query";

import {
  getPlanModelAccess,
  listProviders,
} from "../service/model-providers.service";

export const modelProvidersKeys = {
  all: () => ["model-providers"] as const,
  providers: () => [...modelProvidersKeys.all(), "providers"] as const,
  planAccess: () => [...modelProvidersKeys.all(), "plan-access"] as const,
};

export const modelProvidersOptions = {
  /**
   * One query for the whole screen. The platform defaults come back with the
   * providers rather than from their own endpoint: the defaults panel has to
   * know which models are offered and which providers hold a key in order to
   * render a picker at all, so splitting them would only mean two loading
   * states for one view.
   */
  list: () =>
    queryOptions({
      queryKey: modelProvidersKeys.providers(),
      queryFn: listProviders,
    }),

  /** Separate from the provider list: it changes on its own schedule. */
  planAccess: () =>
    queryOptions({
      queryKey: modelProvidersKeys.planAccess(),
      queryFn: getPlanModelAccess,
    }),
};
