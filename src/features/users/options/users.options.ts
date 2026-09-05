import { queryOptions } from "@tanstack/react-query";

import { getUsers } from "../service/users.service";
import type { UsersParams } from "../params";

/**
 * No `"use client"` in this file, deliberately: the RSC prefetch and the client
 * hook both import it, and a client directive here would break the server build.
 */
export const usersKeys = {
  all: () => ["users"] as const,
  list: (params: UsersParams) => [...usersKeys.all(), "list", params] as const,
};

export const usersOptions = {
  list: (params: UsersParams) =>
    queryOptions({
      queryKey: usersKeys.list(params),
      queryFn: () => getUsers(params),
    }),
};
