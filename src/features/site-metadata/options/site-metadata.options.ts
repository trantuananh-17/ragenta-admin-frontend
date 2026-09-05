import { queryOptions } from "@tanstack/react-query";

import { getSiteMetadata } from "../service/site-metadata.service";

export const siteMetadataKeys = {
  all: () => ["site-metadata"] as const,
};

export const siteMetadataOptions = {
  list: () =>
    queryOptions({
      queryKey: siteMetadataKeys.all(),
      queryFn: getSiteMetadata,
    }),
};
