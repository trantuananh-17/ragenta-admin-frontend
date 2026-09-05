import { z } from "zod";

import { contentApi } from "@/lib/ky-content";

/**
 * Small admin-editable values that are not worth a table each: the community
 * invite link, the status page, the docs site.
 *
 * The key set is closed on the backend — an open one would let the admin API
 * write rows nothing reads. These are URLs, so nothing here is translated; the
 * label beside each on the site is a dictionary string there.
 */
export const SITE_METADATA_KEYS = [
  "community_url",
  "status_url",
  "docs_url",
] as const;
export type SiteMetadataKey = (typeof SITE_METADATA_KEYS)[number];

export const SITE_METADATA_LABELS: Record<
  SiteMetadataKey,
  { label: string; hint: string }
> = {
  community_url: {
    label: "Community",
    hint: "Where the site's Community link points — a Discord or Slack invite.",
  },
  status_url: {
    label: "Status page",
    hint: "The public uptime page linked from the footer.",
  },
  docs_url: {
    label: "Documentation",
    hint: "The docs site linked from the navigation.",
  },
};

export const siteMetadataSchema = z.object({
  key: z.string(),
  value: z.string(),
  createdAt: z.coerce.string(),
  updatedAt: z.coerce.string(),
});

const listSchema = z.object({ settings: z.array(siteMetadataSchema) });
const settingSchema = z.object({ setting: siteMetadataSchema });

export type SiteMetadata = z.infer<typeof siteMetadataSchema>;

export async function getSiteMetadata(): Promise<SiteMetadata[]> {
  const response = await contentApi.get("admin/site-metadata");
  return listSchema.parse(await response.json()).settings;
}

export async function putSiteMetadata(
  key: SiteMetadataKey,
  value: string,
): Promise<SiteMetadata> {
  const response = await contentApi.put(`admin/site-metadata/${key}`, {
    json: { value },
  });
  return settingSchema.parse(await response.json()).setting;
}
