"use client";

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { errorMessage } from "@/lib/api-error";
import { legalKeys, legalOptions } from "../options/legal.options";
import {
  putLegalDocument,
  type LegalSlug,
  type PutLegalDocumentInput,
} from "../service/legal.service";

export function useLegalDocumentsSuspense() {
  return useSuspenseQuery(legalOptions.list());
}

export function useLegalDocumentSuspense(slug: LegalSlug) {
  return useSuspenseQuery(legalOptions.detail(slug));
}

export function usePutLegalDocument(slug: LegalSlug) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PutLegalDocumentInput) => putLegalDocument(slug, input),
    onSuccess: () => {
      toast.success("Document saved", {
        description:
          "The site's Last updated line moves to today for every locale.",
      });
      queryClient.invalidateQueries({ queryKey: legalKeys.all() });
    },
    onError: async (error) => {
      toast.error("Could not save", { description: await errorMessage(error) });
    },
  });
}
