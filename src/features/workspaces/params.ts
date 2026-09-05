import { parseAsInteger, parseAsString, type inferParserType } from "nuqs/server";

export const workspacesParams = {
  page: parseAsInteger.withDefault(1).withOptions({ clearOnDefault: true }),
  limit: parseAsInteger.withDefault(25).withOptions({ clearOnDefault: true }),
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
};

export type WorkspacesParams = inferParserType<typeof workspacesParams>;
