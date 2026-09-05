"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

export const authKeys = {
  all: () => ["auth"] as const,
  session: () => [...authKeys.all(), "session"] as const,
};

export interface LoginCredentials {
  email: string;
  password: string;
}

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password }: LoginCredentials) => {
      const { data, error } = await authClient.signIn.email({ email, password });
      if (error) throw new Error(error.message ?? "Sign in failed.");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.session() });
      // `refresh` re-runs the server gate, which is what decides whether this
      // account may actually see /admin — signing in is not the same as being an
      // administrator.
      router.push("/admin");
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error("Sign in failed", { description: error.message });
    },
  });
}

export function useGoogleSignIn() {
  return useMutation({
    mutationFn: async () => {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}/admin`,
      });
    },
    onError: (error: Error) => {
      toast.error("Google sign-in failed", { description: error.message });
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await authClient.signOut();
    },
    onSuccess: () => {
      // Everything cached was fetched as this admin. Clear it before the next
      // one signs in on the same browser.
      queryClient.clear();
      router.push("/login");
      router.refresh();
    },
    onError: () => {
      toast.error("Sign out failed", { description: "Please try again." });
    },
  });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw new Error(error.message ?? "Could not send the email.");
    },
    onSuccess: () => {
      // Deliberately does not say whether the address exists.
      toast.success("Check your inbox", {
        description: "If that address has an account, a reset link is on its way.",
      });
    },
    onError: (error: Error) => {
      toast.error("Request failed", { description: error.message });
    },
  });
}

export function useResetPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      token,
      newPassword,
    }: {
      token: string;
      newPassword: string;
    }) => {
      const { error } = await authClient.resetPassword({ token, newPassword });
      if (error) throw new Error(error.message ?? "Password reset failed.");
    },
    onSuccess: () => {
      toast.success("Password updated", { description: "Sign in with it now." });
      router.push("/login");
    },
    onError: (error: Error) => {
      toast.error("Reset failed", { description: error.message });
    },
  });
}
