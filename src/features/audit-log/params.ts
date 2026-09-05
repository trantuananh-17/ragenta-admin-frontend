import { parseAsInteger, parseAsString, type inferParserType } from "nuqs/server";

/**
 * `workspaceId` is here because a workspace detail screen links straight into a
 * filtered log — the URL is the only state, so that link is all it takes.
 */
export const auditLogParams = {
  page: parseAsInteger.withDefault(1).withOptions({ clearOnDefault: true }),
  limit: parseAsInteger.withDefault(50).withOptions({ clearOnDefault: true }),
  workspaceId: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  actorId: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  action: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
};

export type AuditLogParams = inferParserType<typeof auditLogParams>;
