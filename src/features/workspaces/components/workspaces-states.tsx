import { AlertCircle, Building2, Loader2 } from "lucide-react";

import { EntityStateView } from "@/components/entity-components";

export function WorkspacesLoading() {
  return (
    <EntityStateView
      icon={<Loader2 className="size-8 animate-spin text-muted-foreground" />}
      title="Loading workspaces..."
    />
  );
}

export function WorkspacesEmpty() {
  return (
    <EntityStateView
      icon={<Building2 className="size-8 text-muted-foreground" />}
      title="No workspaces yet"
      message="A workspace is created the first time somebody signs up."
    />
  );
}

export function WorkspacesError() {
  return (
    <EntityStateView
      icon={<AlertCircle className="size-8 text-destructive" />}
      title="Could not load workspaces"
      message="The platform admin API refused or is unreachable."
    />
  );
}

export function WorkspaceDetailLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export function WorkspaceDetailError() {
  return (
    <EntityStateView
      icon={<AlertCircle className="size-8 text-destructive" />}
      title="Could not load this workspace"
      message="It may have been deleted, or the admin API is unreachable."
    />
  );
}
