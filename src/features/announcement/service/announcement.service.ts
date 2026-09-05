import { z } from "zod";

import { contentApi } from "@/lib/ky-content";
import { localizedTextSchema, type LocalizedText } from "@/lib/locale";

/**
 * The bar above the site's navigation. A singleton — one row, always upserted.
 *
 * A write is a full replacement rather than a patch: the three texts and the
 * link are read together as one banner, and a partial write would leave a bar
 * whose badge and body came from different revisions.
 *
 * The timestamps are optional because the admin endpoint answers with a
 * synthetic empty banner when no row exists yet.
 */
export const announcementSchema = z.object({
  key: z.string(),
  enabled: z.boolean(),
  linkUrl: z.string(),
  badge: localizedTextSchema.partial(),
  fullText: localizedTextSchema.partial(),
  shortText: localizedTextSchema.partial(),
  createdAt: z.coerce.string().optional(),
  updatedAt: z.coerce.string().optional(),
});

const envelopeSchema = z.object({ announcement: announcementSchema });

export type Announcement = z.infer<typeof announcementSchema>;

export interface PutAnnouncementInput {
  enabled: boolean;
  linkUrl: string;
  badge: LocalizedText;
  fullText: LocalizedText;
  shortText: LocalizedText;
}

export async function getAnnouncement(): Promise<Announcement> {
  const response = await contentApi.get("admin/announcement");
  return envelopeSchema.parse(await response.json()).announcement;
}

export async function putAnnouncement(
  input: PutAnnouncementInput,
): Promise<Announcement> {
  const response = await contentApi.put("admin/announcement", { json: input });
  return envelopeSchema.parse(await response.json()).announcement;
}
