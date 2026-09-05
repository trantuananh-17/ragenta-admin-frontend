import { parseAsInteger, parseAsString, type inferParserType } from "nuqs/server";

/**
 * The catalogue pages by number, not by offset — its public search box does, and
 * the admin endpoint answers in the same units.
 */
export const catalogueParams = {
  page: parseAsInteger.withDefault(1).withOptions({ clearOnDefault: true }),
  limit: parseAsInteger.withDefault(25).withOptions({ clearOnDefault: true }),
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  status: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
};

export type CatalogueParams = inferParserType<typeof catalogueParams>;
