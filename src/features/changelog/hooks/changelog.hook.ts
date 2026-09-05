"use client";

import { useRouter } from "next/navigation";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { errorMessage } from "@/lib/api-error";
import { changelogKeys, changelogOptions } from "../options/changelog.options";
import {
  createChangelogEntry,
  deleteChangelogEntry,
  publishChangelogEntry,
  unpublishChangelogEntry,
  updateChangelogEntry,
  type CreateChangelogInput,
  type UpdateChangelogInput,
} from "../service/changelog.service";
import type { ChangelogParams } from "../params";

export function useChangelogSuspense(params: ChangelogParams) {
  return useSuspenseQuery(changelogOptions.list(params));
}

export function useChangelogEntrySuspense(id: string) {
  return useSuspenseQuery(changelogOptions.detail(id));
}

export function useCreateChangelogEntry() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateChangelogInput) => createChangelogEntry(input),
    onSuccess: (entry) => {
      toast.success("Entry created", { description: "It is a draft until published." });
      queryClient.invalidateQueries({ queryKey: changelogKeys.all() });
      router.push(`/admin/content/changelog/${entry.id}`);
    },
    onError: async (error) => {
      toast.error("Could not create the entry", {
        description: await errorMessage(error),
      });
    },
  });
}

export function useUpdateChangelogEntry(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateChangelogInput) => updateChangelogEntry(id, input),
    onSuccess: () => {
      toast.success("Saved");
      queryClient.invalidateQueries({ queryKey: changelogKeys.all() });
    },
    onError: async (error) => {
      toast.error("Could not save", { description: await errorMessage(error) });
    },
  });
}

export function useChangelogPublication(id: string) {
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: changelogKeys.all() });

  const publish = useMutation({
    mutationFn: () => publishChangelogEntry(id),
    onSuccess: () => {
      toast.success("Published", {
        description: "The site picks it up within about five minutes.",
      });
      invalidate();
    },
    onError: async (error) => {
      toast.error("Could not publish", {
        description: await errorMessage(error),
      });
    },
  });

  const unpublish = useMutation({
    mutationFn: () => unpublishChangelogEntry(id),
    onSuccess: () => {
      toast.success("Moved back to draft");
      invalidate();
    },
    onError: async (error) => {
      toast.error("Could not unpublish", {
        description: await errorMessage(error),
      });
    },
  });

  return { publish, unpublish };
}

export function useDeleteChangelogEntry() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteChangelogEntry(id),
    onSuccess: () => {
      toast.success("Entry deleted");
      queryClient.invalidateQueries({ queryKey: changelogKeys.all() });
      router.push("/admin/content/changelog");
    },
    onError: async (error) => {
      toast.error("Could not delete", { description: await errorMessage(error) });
    },
  });
}
