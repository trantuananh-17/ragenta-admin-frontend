"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { promoCodesKeys, promoCodesOptions } from "../options/promo-codes.options";
import {
  createPromoCode,
  deletePromoCode,
  setPromoCodeActive,
  type CreatePromoCodeInput,
} from "../service/promo-codes.service";

/**
 * `useQuery`, not `useSuspenseQuery` as the server-backed screens use: there is
 * no prefetch to hydrate from while the data is a local fixture, so the loading
 * state belongs in the panel rather than in a Suspense boundary above it.
 */
export function usePromoCodes() {
  return useQuery(promoCodesOptions.list());
}

export function useCreatePromoCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePromoCodeInput) => createPromoCode(input),
    onSuccess: (created) => {
      toast.success(`${created.code} created.`);
      queryClient.invalidateQueries({ queryKey: promoCodesKeys.all() });
    },
    onError: (error) => {
      toast.error("Could not create the code", {
        description: error instanceof Error ? error.message : undefined,
      });
    },
  });
}

export function useSetPromoCodeActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setPromoCodeActive(id, active),
    onSuccess: (updated) => {
      toast.success(
        updated.active
          ? `${updated.code} is redeemable again.`
          : `${updated.code} will no longer be accepted.`,
      );
      queryClient.invalidateQueries({ queryKey: promoCodesKeys.all() });
    },
    onError: (error) => {
      toast.error("Could not change the code", {
        description: error instanceof Error ? error.message : undefined,
      });
    },
  });
}

export function useDeletePromoCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePromoCode(id),
    onSuccess: () => {
      toast.success("Code deleted.");
      queryClient.invalidateQueries({ queryKey: promoCodesKeys.all() });
    },
    onError: (error) => {
      toast.error("Could not delete the code", {
        description: error instanceof Error ? error.message : undefined,
      });
    },
  });
}
