import { queryOptions } from "@tanstack/react-query";

import { getIntegrations } from "../service/integrations.service";

export const integrationsKeys = {
  all: () => ["integrations"] as const,
  list: () => [...integrationsKeys.all(), "list"] as const,
};

export const integrationsOptions = {
  list: () =>
    queryOptions({
      queryKey: integrationsKeys.list(),
      queryFn: () => getIntegrations(),
    }),
};
