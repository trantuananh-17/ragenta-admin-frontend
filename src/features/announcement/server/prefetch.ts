import "server-only";

import { getQueryClient } from "@/lib/get-query-client";
import { announcementOptions } from "../options/announcement.options";

export async function prefetchAnnouncement() {
  await getQueryClient().prefetchQuery(announcementOptions.detail());
}
