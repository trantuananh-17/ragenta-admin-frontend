import { createLoader } from "nuqs/server";

import { changelogParams, type ChangelogParams } from "../params";

export const changelogParamsLoader = createLoader(changelogParams);

export type { ChangelogParams };
