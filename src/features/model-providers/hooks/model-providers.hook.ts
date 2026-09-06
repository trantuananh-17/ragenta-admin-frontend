"use client";

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { errorMessage } from "@/lib/api-error";
import {
  modelProvidersKeys,
  modelProvidersOptions,
} from "../options/model-providers.options";
import {
  checkProvider,
  importProviderModels,
  removeModel,
  removeProviderKey,
  saveProviderKey,
  setModelEnabled,
  setPlanModelAccess,
  setPlatformDefaults,
  upsertModel,
  type PlanModelAccess,
  type PlanName,
  type PlatformModelDefaults,
  type SaveProviderKeyInput,
  type UpsertModelInput,
} from "../service/model-providers.service";

export function useProvidersSuspense() {
  return useSuspenseQuery(modelProvidersOptions.list());
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: modelProvidersKeys.all() });
}

function reportFailure(action: string) {
  return async (error: unknown) => {
    toast.error(action, { description: await errorMessage(error) });
  };
}

export function useSaveProviderKey(providerId: string, providerName: string) {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: (input: SaveProviderKeyInput) =>
      saveProviderKey(providerId, input),
    onSuccess: () => {
      toast.success(`${providerName} key saved.`, {
        description: "Only the masked hint is kept on screen from here on.",
      });
      void invalidate();
    },
    onError: reportFailure("Could not save the key"),
  });
}

export function useRemoveProviderKey(providerId: string, providerName: string) {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: () => removeProviderKey(providerId),
    onSuccess: () => {
      toast.success(`${providerName} key removed.`, {
        description: "Its models can no longer be selected by any workspace.",
      });
      void invalidate();
    },
    onError: reportFailure("Could not remove the key"),
  });
}

/**
 * A rejected key is a successful request — the backend answers 200 with
 * `ok: false` — so the failure toast here is for a request that never reached
 * the provider at all.
 */
export function useImportProviderModels(providerId: string) {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: () => importProviderModels(providerId),
    onSuccess: (result) => {
      toast.success("Catalogue imported", { description: result.detail });
      void invalidate();
    },
    onError: reportFailure("Could not import the catalogue"),
  });
}

export function useCheckProvider(providerId: string) {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: () => checkProvider(providerId),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success("The provider accepted the key.", {
          description: result.detail,
        });
      } else {
        toast.error("The provider rejected the key.", {
          description: result.detail,
        });
      }
      void invalidate();
    },
    onError: reportFailure("Could not reach the provider"),
  });
}

export function useSetModelEnabled(providerId: string) {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: ({ model, enabled }: { model: string; enabled: boolean }) =>
      setModelEnabled(providerId, model, enabled),
    onSuccess: () => void invalidate(),
    onError: reportFailure("Could not change the model"),
  });
}

export function useUpsertModel(providerId: string) {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: (input: UpsertModelInput) => upsertModel(providerId, input),
    onSuccess: () => {
      toast.success("Model saved.");
      void invalidate();
    },
    onError: reportFailure("Could not save the model"),
  });
}

export function useRemoveModel(providerId: string) {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: (model: string) => removeModel(providerId, model),
    onSuccess: (result) => {
      toast.success(
        result.revertedToBuiltIn
          ? "Reverted to the built-in definition."
          : "Model removed.",
      );
      void invalidate();
    },
    onError: reportFailure("Could not remove the model"),
  });
}

export function useSetPlatformDefaults() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: (next: PlatformModelDefaults) => setPlatformDefaults(next),
    onSuccess: () => {
      toast.success("Defaults saved.", {
        description:
          "Workspaces that have never chosen a model follow these from their next request.",
      });
      void invalidate();
    },
    onError: reportFailure("Could not save the defaults"),
  });
}

export function usePlanModelAccessSuspense() {
  return useSuspenseQuery(modelProvidersOptions.planAccess());
}

export function useSetPlanModelAccess(plan: PlanName) {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: (input: PlanModelAccess) => setPlanModelAccess(plan, input),
    onSuccess: () => {
      toast.success(`Model access saved for ${plan}.`, {
        description:
          "Workspaces on this plan see the new list on their next request.",
      });
      void invalidate();
    },
    onError: reportFailure("Could not save model access"),
  });
}
