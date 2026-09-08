"use client";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { HTTPError } from "ky";
import { toast } from "sonner";

import { rolesKeys, rolesOptions } from "../options/roles.options";
import {
  createRole,
  deleteRole,
  updateRole,
  type CreateRoleInput,
  type UpdateRoleInput,
} from "../service/roles.service";

export function useRolesSuspense() {
  return useSuspenseQuery(rolesOptions.list());
}

export function usePermissionsSuspense() {
  return useSuspenseQuery(rolesOptions.permissions());
}

/**
 * The backend refuses several of these on purpose — a built-in role's permissions
 * are reset on every deploy, the last super administrator cannot be demoted, a
 * role somebody holds cannot be deleted (ADR-050). Each refusal carries a
 * sentence explaining what to do instead, so it is shown rather than replaced
 * with "something went wrong".
 */
async function describe(error: unknown): Promise<string> {
  if (error instanceof HTTPError) {
    try {
      const body = (await error.response.json()) as { error?: { message?: string } };
      if (body.error?.message) return body.error.message;
    } catch {
      // A non-JSON body means a proxy or gateway answered, not the API.
    }
  }
  return error instanceof Error ? error.message : "The operation failed.";
}

function useRoleMutation<TVariables, TResult>(
  action: (variables: TVariables) => Promise<TResult>,
  successMessage: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: action,
    onSuccess: () => {
      toast.success(successMessage);
      queryClient.invalidateQueries({ queryKey: rolesKeys.all() });
    },
    onError: async (error: unknown) => {
      toast.error("Could not save", { description: await describe(error) });
    },
  });
}

export function useCreateRole() {
  return useRoleMutation((input: CreateRoleInput) => createRole(input), "Role created.");
}

export function useUpdateRole() {
  return useRoleMutation(
    ({ roleId, input }: { roleId: string; input: UpdateRoleInput }) => updateRole(roleId, input),
    "Role saved.",
  );
}

export function useDeleteRole() {
  return useRoleMutation(({ roleId }: { roleId: string }) => deleteRole(roleId), "Role deleted.");
}
