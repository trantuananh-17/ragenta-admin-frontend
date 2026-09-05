"use client";

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { errorMessage } from "@/lib/api-error";
import {
  siteMetadataKeys,
  siteMetadataOptions,
} from "../options/site-metadata.options";
import {
  putSiteMetadata,
  type SiteMetadataKey,
} from "../service/site-metadata.service";

export function useSiteMetadataSuspense() {
  return useSuspenseQuery(siteMetadataOptions.list());
}

export function usePutSiteMetadata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, value }: { key: SiteMetadataKey; value: string }) =>
      putSiteMetadata(key, value),
    onSuccess: () => {
      toast.success("Saved");
      queryClient.invalidateQueries({ queryKey: siteMetadataKeys.all() });
    },
    onError: async (error) => {
      toast.error("Could not save", { description: await errorMessage(error) });
    },
  });
}
