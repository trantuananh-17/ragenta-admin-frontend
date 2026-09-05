import { createLoader } from "nuqs/server";

import { usersParams, type UsersParams } from "../params";

export const usersParamsLoader = createLoader(usersParams);

export type { UsersParams };
