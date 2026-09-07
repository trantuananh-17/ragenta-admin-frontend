"use client";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { errorMessage } from "@/lib/api-error";

import { speechKeys, speechOptions } from "../options/speech.options";
import {
  checkSpeechEndpoint,
  clearSpeechEndpoint,
  saveSpeechEndpoint,
  type SaveSpeechEndpointInput,
  type SpeechCapability,
} from "../service/speech.service";

export function useSpeechSettingsSuspense() {
  return useSuspenseQuery(speechOptions.settings());
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: speechKeys.all() });
}

const LABEL: Record<SpeechCapability, string> = {
  stt: "Transcription",
  tts: "Synthesis",
};

export function useSaveSpeechEndpoint() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: (input: {
      capability: SpeechCapability;
      values: SaveSpeechEndpointInput;
    }) => saveSpeechEndpoint(input.capability, input.values),
    onSuccess: (_settings, input) => {
      toast.success(`${LABEL[input.capability]} saved.`, {
        description: "Run the check to prove the host, the key and the model together.",
      });
      void invalidate();
    },
    onError: async (error) => {
      toast.error("That could not be saved", {
        description: await errorMessage(error),
      });
    },
  });
}

export function useClearSpeechEndpoint() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: (capability: SpeechCapability) => clearSpeechEndpoint(capability),
    onSuccess: (settings, capability) => {
      toast.success(`${LABEL[capability]} cleared.`, {
        description: settings[capability].configured
          ? "This deployment's environment still configures it."
          : "It is now switched off.",
      });
      void invalidate();
    },
    onError: async (error) => {
      toast.error("That could not be cleared", {
        description: await errorMessage(error),
      });
    },
  });
}

/**
 * One real call, because a configuration that parses is not one that works. The
 * host, the key and the model id are only ever proven together, and finding out
 * at a customer's first recording is finding out too late.
 */
export function useCheckSpeechEndpoint() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: (capability: SpeechCapability) => checkSpeechEndpoint(capability),
    onSuccess: (result, capability) => {
      if (result.ok) {
        toast.success(`${LABEL[capability]} answered.`);
      } else {
        toast.error(`${LABEL[capability]} did not answer`, {
          description: result.detail,
        });
      }
      void invalidate();
    },
    onError: async (error) => {
      toast.error("The check could not be run", {
        description: await errorMessage(error),
      });
    },
  });
}
