import { queryOptions } from "@tanstack/react-query";

import { getPost, getPosts } from "../service/posts.service";
import type { PostsParams } from "../params";

export const postsKeys = {
  all: () => ["posts"] as const,
  list: (params: PostsParams) => [...postsKeys.all(), "list", params] as const,
  detail: (id: string) => [...postsKeys.all(), "detail", id] as const,
};

export const postsOptions = {
  list: (params: PostsParams) =>
    queryOptions({
      queryKey: postsKeys.list(params),
      queryFn: () => getPosts(params),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: postsKeys.detail(id),
      queryFn: () => getPost(id),
    }),
};
