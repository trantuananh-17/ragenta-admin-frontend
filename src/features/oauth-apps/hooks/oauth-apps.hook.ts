"use client";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { HTTPError } from "ky";
import { toast } from "sonner";

import { oauthAppsKeys, oauthAppsOptions } from "../options/oauth-apps.options";
import { saveOAuthClient, type SaveOAuthClientInput } from "../service/oauth-apps.service";

export function useOAuthProvidersSuspense() {
  return useSuspenseQuery(oauthAppsOptions.list());
}

/** The backend's own message, which names what is missing. */
async function describe(error: unknown): Promise<string> {
  if (error instanceof HTTPError) {
    try {
      const body = (await error.response.json()) as { error?: { message?: string } };
      if (body.error?.message) return body.error.message;
    } catch {
      // A non-JSON body means a proxy answered, not the API.
    }
  }
  return error instanceof Error ? error.message : "The change was not saved.";
}

export function useSaveOAuthClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ provider, input }: { provider: string; input: SaveOAuthClientInput }) =>
      saveOAuthClient(provider, input),
    onSuccess: () => {
      toast.success("Saved.");
      queryClient.invalidateQueries({ queryKey: oauthAppsKeys.all() });
    },
    onError: async (error: unknown) => {
      toast.error("Could not save", { description: await describe(error) });
    },
  });
}
