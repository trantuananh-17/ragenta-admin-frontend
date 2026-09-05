import { AlertCircle, Loader2, UserCircle } from "lucide-react";

import { EntityStateView } from "@/components/entity-components";

export function UsersLoading() {
  return (
    <EntityStateView
      icon={<Loader2 className="size-8 animate-spin text-muted-foreground" />}
      title="Loading accounts..."
    />
  );
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
