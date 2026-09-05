"use client";

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { errorMessage } from "@/lib/api-error";
import {
  announcementKeys,
  announcementOptions,
} from "../options/announcement.options";
import {
  putAnnouncement,
  type PutAnnouncementInput,
} from "../service/announcement.service";

export function useAnnouncementSuspense() {
  return useSuspenseQuery(announcementOptions.detail());
}

export function usePutAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PutAnnouncementInput) => putAnnouncement(input),
    onSuccess: () => {
      // The site re-shows a bar a reader dismissed when the copy changes, keyed
      // on updatedAt — so saving is what brings it back for everyone.
      toast.success("Announcement saved", {
        description: "Readers who dismissed the previous copy will see this one.",
      });
      queryClient.invalidateQueries({ queryKey: announcementKeys.all() });
    },
    onError: async (error) => {
      toast.error("Could not save", { description: await errorMessage(error) });
    },
  });
}
