import { z } from "zod";

import { contentApi } from "@/lib/ky-content";
import { LOCALES } from "@/lib/locale";
import { pageSchema, toOffset } from "@/lib/pagination";
import type { PostsParams } from "../params";

/**
 * Blog posts on `ragenta-content-backend`. A post is one row plus one
 * translation row per locale: the admin list returns the row alone, the detail
 * returns it with every translation it has.
 *
 * A partial update replaces a locale wholesale and leaves the locales it does
 * not mention untouched — which is why the form always submits a complete
 * translation object for the locales it edited.
 */
export const postRowSchema = z.object({
  id: z.string(),
  slug: z.string(),
  heroImageUrl: z.string().nullable(),
  status: z.string(),
  publishedAt: z.coerce.string().nullable(),
  createdAt: z.coerce.string(),
  updatedAt: z.coerce.string(),
});

export const postTranslationSchema = z.object({
  postId: z.string(),
  locale: z.enum(LOCALES),
  title: z.string(),
  excerpt: z.string().nullable(),
  bodyMd: z.string(),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  tags: z.array(z.string()),
  readingMinutes: z.number(),
  createdAt: z.coerce.string(),
  updatedAt: z.coerce.string(),
});

export const postDetailSchema = postRowSchema.extend({
  translations: z.array(postTranslationSchema),
});

export const postsPageSchema = pageSchema(postRowSchema);
const postEnvelopeSchema = z.object({ post: postDetailSchema });

export type PostRow = z.infer<typeof postRowSchema>;
export type PostTranslation = z.infer<typeof postTranslationSchema>;
export type PostDetail = z.infer<typeof postDetailSchema>;

/** What a form submits for one locale. `en` is required on create. */
export interface PostTranslationInput {
  title: string;
  excerpt?: string | null;
  bodyMd: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  tags: string[];
  readingMinutes?: number;
}

export interface CreatePostInput {
  slug?: string;
  heroImageUrl?: string | null;
  translations: { en: PostTranslationInput; vi?: PostTranslationInput };
}

export interface UpdatePostInput {
  heroImageUrl?: string | null;
  translations?: { en?: PostTranslationInput; vi?: PostTranslationInput };
}

export async function getPosts(params: PostsParams) {
  const searchParams: Record<string, string | number> = {
    limit: params.limit,
    offset: toOffset(params.page, params.limit),
  };
  if (params.search) searchParams.search = params.search;
  if (params.status) searchParams.status = params.status;

  const response = await contentApi.get("admin/posts", { searchParams });
  return postsPageSchema.parse(await response.json());
}

export async function getPost(id: string): Promise<PostDetail> {
  const response = await contentApi.get(`admin/posts/${id}`);
  return postEnvelopeSchema.parse(await response.json()).post;
}

export async function createPost(input: CreatePostInput): Promise<PostDetail> {
  const response = await contentApi.post("admin/posts", { json: input });
  return postEnvelopeSchema.parse(await response.json()).post;
}

export async function updatePost(
  id: string,
  input: UpdatePostInput,
): Promise<PostDetail> {
  const response = await contentApi.patch(`admin/posts/${id}`, { json: input });
  return postEnvelopeSchema.parse(await response.json()).post;
}

export async function publishPost(id: string): Promise<PostDetail> {
  const response = await contentApi.post(`admin/posts/${id}/publish`);
  return postEnvelopeSchema.parse(await response.json()).post;
}

export async function unpublishPost(id: string): Promise<PostDetail> {
  const response = await contentApi.post(`admin/posts/${id}/unpublish`);
  return postEnvelopeSchema.parse(await response.json()).post;
}

export async function deletePost(id: string): Promise<void> {
  await contentApi.delete(`admin/posts/${id}`);
}
