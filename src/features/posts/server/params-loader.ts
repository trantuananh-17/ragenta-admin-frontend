import { createLoader } from "nuqs/server";

import { postsParams, type PostsParams } from "../params";

export const postsParamsLoader = createLoader(postsParams);

export type { PostsParams };
