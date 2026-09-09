import { AlertCircle, UserCircle } from "lucide-react";

import {
  EntityStateView,
  EntityTableSkeleton,
} from "@/components/entity-components";

export function UsersLoading() {
  return <EntityTableSkeleton columns={6} />;
}

export function UsersEmpty() {
  return (
    <EntityStateView
      icon={<UserCircle className="size-8 text-muted-foreground" />}
      title="No accounts yet"
      message="Nobody has signed up on this environment."
    />
  );
}

export function UsersError() {
  return (
    <EntityStateView
      icon={<AlertCircle className="size-8 text-destructive" />}
      title="Could not load accounts"
      message="The platform admin API refused or is unreachable. Check that this account still has the admin role."
    />
  );
}
