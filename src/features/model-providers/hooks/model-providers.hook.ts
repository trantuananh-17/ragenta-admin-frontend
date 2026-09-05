"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  modelProvidersKeys,
  modelProvidersOptions,
} from "../options/model-providers.options";
import {
  addCustomModel,
  removeCustomModel,
  removeProviderKey,
  saveProviderKey,
  setModelEnabled,
  setPlatformDefaults,
  type AddCustomModelInput,
  type PlatformModelDefaults,
  type SaveProviderKeyInput,
} from "../service/model-providers.service";

export function useProviders() {
  return useQuery(modelProvidersOptions.list());
}

export function usePlatformDefaults() {
  return useQuery(modelProvidersOptions.defaults());
}

function reportFailure(action: string) {
  return (error: unknown) => {
    toast.error(action, {
      description: error instanceof Error ? error.message : undefined,
    });
  };
}

export function useSaveProviderKey(providerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveProviderKeyInput) =>
      saveProviderKey(providerId, input),
    onSuccess: (provider) => {
      toast.success(`${provider.name} key saved.`, {
        description: "Only the masked hint is kept on screen from here on.",
      });
      queryClient.invalidateQueries({ queryKey: modelProvidersKeys.providers() });
    },
    onError: reportFailure("Could not save the key"),
  });
}

export function useRemoveProviderKey(providerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => removeProviderKey(providerId),
    onSuccess: (provider) => {
      toast.success(`${provider.name} key removed.`, {
        description: "Its models can no longer be selected by any workspace.",
      });
      queryClient.invalidateQueries({ queryKey: modelProvidersKeys.providers() });
    },
    onError: reportFailure("Could not remove the key"),
  });
}

export function useSetModelEnabled(providerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ modelId, enabled }: { modelId: string; enabled: boolean }) =>
      setModelEnabled(providerId, modelId, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: modelProvidersKeys.providers() });
    },
    onError: reportFailure("Could not change the model"),
  });
}

export function useAddCustomModel(providerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddCustomModelInput) =>
      addCustomModel(providerId, input),
    onSuccess: () => {
      toast.success("Model added.");
      queryClient.invalidateQueries({ queryKey: modelProvidersKeys.providers() });
    },
    onError: reportFailure("Could not add the model"),
  });
}

export function useRemoveCustomModel(providerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (modelId: string) => removeCustomModel(providerId, modelId),
    onSuccess: () => {
      toast.success("Model removed.");
      queryClient.invalidateQueries({ queryKey: modelProvidersKeys.providers() });
    },
    onError: reportFailure("Could not remove the model"),
  });
}

export function useSetPlatformDefaults() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (next: PlatformModelDefaults) => setPlatformDefaults(next),
    onSuccess: () => {
      toast.success("Defaults saved.", {
        description:
          "Workspaces that have never chosen a model follow these from their next request.",
      });
      queryClient.invalidateQueries({ queryKey: modelProvidersKeys.defaults() });
    },
    onError: reportFailure("Could not save the defaults"),
  });
}
