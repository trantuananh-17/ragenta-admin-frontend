import { queryOptions } from "@tanstack/react-query";

import {
  getMemberRoles,
  getWorkspace,
  getWorkspaceMembers,
  getWorkspaces,
} from "../service/workspaces.service";
import type { WorkspacesParams } from "../params";

export const workspacesKeys = {
  all: () => ["workspaces"] as const,
  list: (params: WorkspacesParams) =>
    [...workspacesKeys.all(), "list", params] as const,
  detail: (workspaceId: string) =>
    [...workspacesKeys.all(), "detail", workspaceId] as const,
  members: (workspaceId: string) =>
    [...workspacesKeys.all(), "members", workspaceId] as const,
  memberRoles: (workspaceId: string, memberId: string) =>
    [...workspacesKeys.members(workspaceId), memberId, "roles"] as const,
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
  members: (workspaceId: string) =>
    queryOptions({
      queryKey: workspacesKeys.members(workspaceId),
      queryFn: () => getWorkspaceMembers(workspaceId),
    }),
  memberRoles: (workspaceId: string, memberId: string) =>
    queryOptions({
      queryKey: workspacesKeys.memberRoles(workspaceId, memberId),
      queryFn: () => getMemberRoles(workspaceId, memberId),
    }),
};
