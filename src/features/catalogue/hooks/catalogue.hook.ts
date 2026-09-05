"use client";

import { useRouter } from "next/navigation";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { errorMessage } from "@/lib/api-error";
import { catalogueKeys, catalogueOptions } from "../options/catalogue.options";
import {
  createCatalogueItem,
  deleteCatalogueItem,
  updateCatalogueItem,
  type CreateCatalogueItemInput,
  type UpdateCatalogueItemInput,
} from "../service/catalogue.service";
import type { CatalogueParams } from "../params";

export function useCatalogueSuspense(params: CatalogueParams) {
  return useSuspenseQuery(catalogueOptions.list(params));
}

export function useCatalogueItemSuspense(id: string) {
  return useSuspenseQuery(catalogueOptions.detail(id));
}

export function useCreateCatalogueItem() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCatalogueItemInput) => createCatalogueItem(input),
    onSuccess: (item) => {
      toast.success("Item created");
      queryClient.invalidateQueries({ queryKey: catalogueKeys.all() });
      router.push(`/admin/content/catalogue/${item.id}`);
    },
    onError: async (error) => {
      toast.error("Could not create the item", {
        description: await errorMessage(error),
      });
    },
  });
}

export function useUpdateCatalogueItem(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateCatalogueItemInput) =>
      updateCatalogueItem(id, input),
    onSuccess: () => {
      toast.success("Saved");
      queryClient.invalidateQueries({ queryKey: catalogueKeys.all() });
    },
    onError: async (error) => {
      toast.error("Could not save", { description: await errorMessage(error) });
    },
  });
}

export function useDeleteCatalogueItem() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCatalogueItem(id),
    onSuccess: () => {
      toast.success("Item deleted");
      queryClient.invalidateQueries({ queryKey: catalogueKeys.all() });
      router.push("/admin/content/catalogue");
    },
    onError: async (error) => {
      toast.error("Could not delete", { description: await errorMessage(error) });
    },
  });
}
