import { parseAsInteger, parseAsString, type inferParserType } from "nuqs/server";

/** Mirrors `CONTENT_STATUSES` in ragenta-content-backend. */
export const CONTENT_STATUSES = ["draft", "published"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

/** An empty `status` means "any" — the backend omits the filter entirely. */
export const postsParams = {
  page: parseAsInteger.withDefault(1).withOptions({ clearOnDefault: true }),
  limit: parseAsInteger.withDefault(25).withOptions({ clearOnDefault: true }),
  /** The admin list searches the slug only, not the translated title. */
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  status: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
};

export type PostsParams = inferParserType<typeof postsParams>;
