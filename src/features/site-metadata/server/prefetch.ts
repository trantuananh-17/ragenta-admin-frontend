import "server-only";

import { getQueryClient } from "@/lib/get-query-client";
import { siteMetadataOptions } from "../options/site-metadata.options";

export async function prefetchSiteMetadata() {
  await getQueryClient().prefetchQuery(siteMetadataOptions.list());
}
