import { createLoader } from "nuqs/server";

import { workspacesParams, type WorkspacesParams } from "../params";

export const workspacesParamsLoader = createLoader(workspacesParams);

export type { WorkspacesParams };
