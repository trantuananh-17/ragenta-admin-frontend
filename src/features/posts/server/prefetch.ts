import "server-only";

import { getQueryClient } from "@/lib/get-query-client";
import { postsOptions } from "../options/posts.options";
import type { PostsParams } from "../params";

export async function prefetchPosts(params: PostsParams) {
  await getQueryClient().prefetchQuery(postsOptions.list(params));
}

export async function prefetchPost(id: string) {
  await getQueryClient().prefetchQuery(postsOptions.detail(id));
}
