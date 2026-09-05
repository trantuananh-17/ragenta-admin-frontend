import { queryOptions } from "@tanstack/react-query";

import { getWorkspace, getWorkspaces } from "../service/workspaces.service";
import type { WorkspacesParams } from "../params";

export const workspacesKeys = {
  all: () => ["workspaces"] as const,
  list: (params: WorkspacesParams) =>
    [...workspacesKeys.all(), "list", params] as const,
  detail: (workspaceId: string) =>
    [...workspacesKeys.all(), "detail", workspaceId] as const,
};

export const workspacesOptions = {
  list: (params: WorkspacesParams) =>
    queryOptions({
      queryKey: workspacesKeys.list(params),
      queryFn: () => getWorkspaces(params),
    }),
  detail: (workspaceId: string) =>
    queryOptions({
      queryKey: workspacesKeys.detail(workspaceId),
      queryFn: () => getWorkspace(workspaceId),
    }),
};
