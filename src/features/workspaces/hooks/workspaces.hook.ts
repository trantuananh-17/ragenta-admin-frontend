"use client";

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { errorMessage } from "@/lib/api-error";
import { workspacesKeys, workspacesOptions } from "../options/workspaces.options";
import {
  adjustCredits,
  setWorkspacePlan,
  type AdjustCreditsInput,
} from "../service/workspaces.service";
import type { WorkspacesParams } from "../params";

export function useWorkspacesSuspense(params: WorkspacesParams) {
  return useSuspenseQuery(workspacesOptions.list(params));
}

export function useWorkspaceSuspense(workspaceId: string) {
  return useSuspenseQuery(workspacesOptions.detail(workspaceId));
}

export function useAdjustCredits(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AdjustCreditsInput) => adjustCredits(workspaceId, input),
    onSuccess: () => {
      toast.success("Credits adjusted", {
        description: "The ledger and the balance moved together.",
      });
      // The list carries the balance too, so both go stale.
      queryClient.invalidateQueries({ queryKey: workspacesKeys.all() });
    },
    onError: async (error) => {
      toast.error("Adjustment refused", {
        description: await errorMessage(error),
      });
    },
  });
}

export function useSetWorkspacePlan(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (plan: string) => setWorkspacePlan(workspaceId, plan),
    onSuccess: (_result, plan) => {
      toast.success(`Plan changed to ${plan}.`);
      queryClient.invalidateQueries({ queryKey: workspacesKeys.all() });
    },
    onError: async (error) => {
      toast.error("Plan change refused", {
        description: await errorMessage(error),
      });
    },
  });
}
