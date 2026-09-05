import "server-only";

import { getQueryClient } from "@/lib/get-query-client";
import { changelogOptions } from "../options/changelog.options";
import type { ChangelogParams } from "../params";

export async function prefetchChangelog(params: ChangelogParams) {
  await getQueryClient().prefetchQuery(changelogOptions.list(params));
}

export async function prefetchChangelogEntry(id: string) {
  await getQueryClient().prefetchQuery(changelogOptions.detail(id));
}
