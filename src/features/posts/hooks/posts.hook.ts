"use client";

import { useRouter } from "next/navigation";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { errorMessage } from "@/lib/api-error";
import { postsKeys, postsOptions } from "../options/posts.options";
import {
  createPost,
  deletePost,
  publishPost,
  unpublishPost,
  updatePost,
  type CreatePostInput,
  type UpdatePostInput,
} from "../service/posts.service";
import type { PostsParams } from "../params";

export function usePostsSuspense(params: PostsParams) {
  return useSuspenseQuery(postsOptions.list(params));
}

export function usePostSuspense(id: string) {
  return useSuspenseQuery(postsOptions.detail(id));
}

export function useCreatePost() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePostInput) => createPost(input),
    onSuccess: (post) => {
      toast.success("Post created", { description: "It is a draft until published." });
      queryClient.invalidateQueries({ queryKey: postsKeys.all() });
      router.push(`/admin/content/posts/${post.id}`);
    },
    onError: async (error) => {
      toast.error("Could not create the post", {
        description: await errorMessage(error),
      });
    },
  });
}

export function useUpdatePost(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdatePostInput) => updatePost(id, input),
    onSuccess: () => {
      toast.success("Saved");
      queryClient.invalidateQueries({ queryKey: postsKeys.all() });
    },
    onError: async (error) => {
      toast.error("Could not save", { description: await errorMessage(error) });
    },
  });
}

export function usePostPublication(id: string) {
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: postsKeys.all() });

  const publish = useMutation({
    mutationFn: () => publishPost(id),
    onSuccess: () => {
      // The site caches content for 300s, so "live" is not instant.
      toast.success("Published", {
        description: "The site picks it up within about five minutes.",
      });
      invalidate();
    },
    onError: async (error) => {
      toast.error("Could not publish", {
        description: await errorMessage(error),
      });
    },
  });

  const unpublish = useMutation({
    mutationFn: () => unpublishPost(id),
    onSuccess: () => {
      toast.success("Moved back to draft");
      invalidate();
    },
    onError: async (error) => {
      toast.error("Could not unpublish", {
        description: await errorMessage(error),
      });
    },
  });

  return { publish, unpublish };
}

export function useDeletePost() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePost(id),
    onSuccess: () => {
      toast.success("Post deleted");
      queryClient.invalidateQueries({ queryKey: postsKeys.all() });
      router.push("/admin/content/posts");
    },
    onError: async (error) => {
      toast.error("Could not delete", { description: await errorMessage(error) });
    },
  });
}
