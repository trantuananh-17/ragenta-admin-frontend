import { queryOptions } from "@tanstack/react-query";

import { getOAuthProviders } from "../service/oauth-apps.service";

export const oauthAppsKeys = {
  all: () => ["oauth-apps"] as const,
};

export const oauthAppsOptions = {
  list: () =>
    queryOptions({ queryKey: oauthAppsKeys.all(), queryFn: getOAuthProviders }),
};
