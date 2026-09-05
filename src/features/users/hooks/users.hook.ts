"use client";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { usersOptions, usersKeys } from "../options/users.options";
import type { UsersParams } from "../params";

export function useUsersSuspense(params: UsersParams) {
  return useSuspenseQuery(usersOptions.list(params));
}

/**
 * Account operations go through Better Auth's admin plugin rather than a Ragenta
 * endpoint — identity is its surface, and duplicating it in a product route is
 * what the backend deliberately avoids.
 */
function useUserMutation<TVariables>(
  action: (variables: TVariables) => Promise<{ error?: { message?: string } | null }>,
  successMessage: (variables: TVariables) => string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const { error } = await action(variables);
      if (error) throw new Error(error.message ?? "The operation failed.");
      return variables;
    },
    onSuccess: (variables) => {
      toast.success(successMessage(variables));
      queryClient.invalidateQueries({ queryKey: usersKeys.all() });
    },
    onError: (error: Error) => {
      toast.error("Operation failed", { description: error.message });
    },
  });
}

export function useSetUserRole() {
  return useUserMutation(
    ({ userId, role }: { userId: string; role: "admin" | "user" }) =>
      authClient.admin.setRole({ userId, role }),
    ({ role }) => `Role set to ${role}.`,
  );
}

export function useBanUser() {
  return useUserMutation(
    ({ userId, reason }: { userId: string; reason: string }) =>
      authClient.admin.banUser({ userId, banReason: reason }),
    () => "Account suspended.",
  );
}

export function useUnbanUser() {
  return useUserMutation(
    ({ userId }: { userId: string }) => authClient.admin.unbanUser({ userId }),
    () => "Account restored.",
  );
}

export function useRevokeUserSessions() {
  return useUserMutation(
    ({ userId }: { userId: string }) =>
      authClient.admin.revokeUserSessions({ userId }),
    () => "Every session for this account was revoked.",
  );
}
