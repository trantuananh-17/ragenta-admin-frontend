import { queryOptions } from "@tanstack/react-query";

import { getAnnouncement } from "../service/announcement.service";

export const announcementKeys = {
  all: () => ["announcement"] as const,
};

export const announcementOptions = {
  detail: () =>
    queryOptions({
      queryKey: announcementKeys.all(),
      queryFn: getAnnouncement,
    }),
};
