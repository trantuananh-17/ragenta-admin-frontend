import { parseAsInteger, parseAsString, type inferParserType } from "nuqs/server";

/**
 * List state lives in the URL, not in component state: it is the query key, so a
 * filtered page is deep-linkable and the back button works.
 */
export const usersParams = {
  page: parseAsInteger.withDefault(1).withOptions({ clearOnDefault: true }),
  limit: parseAsInteger.withDefault(25).withOptions({ clearOnDefault: true }),
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
};

export type UsersParams = inferParserType<typeof usersParams>;
