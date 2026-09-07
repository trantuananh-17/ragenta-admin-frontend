"use client";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { errorMessage } from "@/lib/api-error";

import { integrationsKeys, integrationsOptions } from "../options/integrations.options";
import {
  checkIntegration,
  deleteIntegration,
  saveIntegration,
  type SaveIntegrationInput,
} from "../service/integrations.service";

export function useIntegrationsSuspense() {
  return useSuspenseQuery(integrationsOptions.list());
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: integrationsKeys.all() });
}

export function useSaveIntegration() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: (input: { id: string; values: SaveIntegrationInput }) =>
      saveIntegration(input.id, input.values),
    onSuccess: (saved) => {
      toast.success(`${saved.name} saved.`);
      void invalidate();
    },
    onError: async (error) => {
      toast.error("That connection could not be saved", {
        description: await errorMessage(error),
      });
    },
  });
}

export function useDeleteIntegration() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: (id: string) => deleteIntegration(id),
    onSuccess: () => {
      toast.success("Connection deleted.");
      void invalidate();
    },
    onError: async (error) => {
      toast.error("That connection could not be deleted", {
        description: await errorMessage(error),
      });
    },
  });
}

/**
 * One live call proving the connection works, with the outcome kept on the row.
 *
 * The same affordance the models screen has, for the same reason: an
 * administrator should not have to run an agent to find out that a key is wrong.
 */
export function useCheckIntegration() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: (id: string) => checkIntegration(id),
    onSuccess: (result) => {
      if (result.ok) toast.success(result.detail);
      else toast.error("The connection did not answer", { description: result.detail });
      void invalidate();
    },
    onError: async (error) => {
      toast.error("The check could not be run", {
        description: await errorMessage(error),
      });
    },
  });
}
