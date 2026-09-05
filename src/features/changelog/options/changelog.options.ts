import { queryOptions } from "@tanstack/react-query";

import {
  getChangelogEntries,
  getChangelogEntry,
} from "../service/changelog.service";
import type { ChangelogParams } from "../params";

export const changelogKeys = {
  all: () => ["changelog"] as const,
  list: (params: ChangelogParams) =>
    [...changelogKeys.all(), "list", params] as const,
  detail: (id: string) => [...changelogKeys.all(), "detail", id] as const,
};

export const changelogOptions = {
  list: (params: ChangelogParams) =>
    queryOptions({
      queryKey: changelogKeys.list(params),
      queryFn: () => getChangelogEntries(params),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: changelogKeys.detail(id),
      queryFn: () => getChangelogEntry(id),
    }),
};
