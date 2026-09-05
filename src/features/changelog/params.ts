import { parseAsInteger, parseAsString, type inferParserType } from "nuqs/server";

/** Mirrors `CHANGELOG_TYPES` in ragenta-content-backend. */
export const CHANGELOG_TYPES = [
  "Release",
  "Model",
  "Integration",
  "Improvement",
  "Fix",
] as const;
export type ChangelogType = (typeof CHANGELOG_TYPES)[number];

export const changelogParams = {
  page: parseAsInteger.withDefault(1).withOptions({ clearOnDefault: true }),
  limit: parseAsInteger.withDefault(25).withOptions({ clearOnDefault: true }),
  status: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
};

export type ChangelogParams = inferParserType<typeof changelogParams>;
