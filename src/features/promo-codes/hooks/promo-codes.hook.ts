"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { errorMessage } from "@/lib/api-error";

import { promoCodesKeys, promoCodesOptions } from "../options/promo-codes.options";
import {
  createPromoCode,
  deletePromoCode,
  setPromoCodeActive,
  type CreatePromoCodeInput,
} from "../service/promo-codes.service";

export function usePromoCodesSuspense() {
  return useSuspenseQuery(promoCodesOptions.list());
}

/**
 * `useQuery`, not the suspense variant: the dialog opens immediately and fills
 * in, rather than suspending the table behind it while a row is inspected.
 */
export function usePromoRedemptions(promoCodeId: string, enabled: boolean) {
  return useQuery({ ...promoCodesOptions.redemptions(promoCodeId), enabled });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: promoCodesKeys.all() });
}

export function useCreatePromoCode() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: (input: CreatePromoCodeInput) => createPromoCode(input),
    onSuccess: (created) => {
      toast.success(`${created.code} created.`);
      void invalidate();
    },
    onError: async (error) => {
      toast.error("Could not create the code", {
        description: await errorMessage(error),
      });
    },
  });
}

export function useSetPromoCodeActive() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setPromoCodeActive(id, active),
    onSuccess: (updated) => {
      toast.success(
        updated.active
          ? `${updated.code} is redeemable again.`
          : `${updated.code} will no longer be accepted.`,
      );
      void invalidate();
    },
    onError: async (error) => {
      toast.error("Could not change the code", {
        description: await errorMessage(error),
      });
    },
  });
}

export function useDeletePromoCode() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: (id: string) => deletePromoCode(id),
    onSuccess: () => {
      toast.success("Code deleted.");
      void invalidate();
    },
    onError: async (error) => {
      toast.error("Could not delete the code", {
        description: await errorMessage(error),
      });
    },
  });
}
