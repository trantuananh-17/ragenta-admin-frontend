import { AlertCircle, FileText } from "lucide-react";

import {
  EntityStateView,
  EntityTableSkeleton,
} from "@/components/entity-components";
import { Spinner } from "@/components/ui/spinner";

export function PostsLoading() {
  return <EntityTableSkeleton columns={4} />;
}

export function PostsEmpty() {
  return (
    <EntityStateView
      icon={<FileText className="size-8 text-muted-foreground" />}
      title="No posts yet"
      message="Create one and the blog index picks it up once it is published."
    />
  );
}

export function PostsError() {
  return (
    <EntityStateView
      icon={<AlertCircle className="size-8 text-destructive" />}
      title="Could not load posts"
      message="The content backend refused or is unreachable."
    />
  );
}

export function PostDetailLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner className="size-8 text-muted-foreground" />
    </div>
  );
}

export function PostDetailError() {
  return (
    <EntityStateView
      icon={<AlertCircle className="size-8 text-destructive" />}
      title="Could not load this post"
      message="It may have been deleted, or the content backend is unreachable."
    />
  );
}
