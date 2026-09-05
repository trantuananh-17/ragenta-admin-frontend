import { PostCreate } from "@/features/posts/components";
import { requireAuth } from "@/lib/auth";

export default async function NewPostPage() {
  await requireAuth();

  return <PostCreate />;
}
