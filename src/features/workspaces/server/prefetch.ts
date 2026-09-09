import "server-only";

import { getQueryClient } from "@/lib/get-query-client";
import { workspacesOptions } from "../options/workspaces.options";
import type { WorkspacesParams } from "../params";

export async function prefetchWorkspaces(params: WorkspacesParams) {
  await getQueryClient().prefetchQuery(workspacesOptions.list(params));
}

export async function prefetchWorkspace(workspaceId: string) {
  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(workspacesOptions.detail(workspaceId)),
    queryClient.prefetchQuery(workspacesOptions.members(workspaceId)),
  ]);
}
