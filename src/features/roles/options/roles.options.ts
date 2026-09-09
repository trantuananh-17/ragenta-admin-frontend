import { queryOptions } from "@tanstack/react-query";

import { getPermissions, getRoles } from "../service/roles.service";

/**
 * No `"use client"` here, deliberately: the RSC prefetch and the client hook both
 * import it, and a client directive would break the server build.
 */
export const rolesKeys = {
  all: () => ["roles"] as const,
  list: (workspaceId?: string) =>
    [...rolesKeys.all(), "list", workspaceId ?? null] as const,
  permissions: () => ["permissions"] as const,
};

export const rolesOptions = {
  list: (workspaceId?: string) =>
    queryOptions({
      queryKey: rolesKeys.list(workspaceId),
      queryFn: () => getRoles(workspaceId),
    }),
  /**
   * The catalogue changes only when a release does, so it is worth holding on to
   * for the length of a session rather than refetching beside every role write.
   */
  permissions: () =>
    queryOptions({
      queryKey: rolesKeys.permissions(),
      queryFn: getPermissions,
      staleTime: Number.POSITIVE_INFINITY,
    }),
};
