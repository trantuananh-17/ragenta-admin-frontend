import { AlertCircle, Loader2, ScrollText } from "lucide-react";

import { EntityStateView } from "@/components/entity-components";

export function AuditLogLoading() {
  return (
    <EntityStateView
      icon={<Loader2 className="size-8 animate-spin text-muted-foreground" />}
      title="Loading the audit log..."
    />
  );
}

export function AuditLogEmpty() {
  return (
    <EntityStateView
      icon={<ScrollText className="size-8 text-muted-foreground" />}
      title="Nothing recorded yet"
      message="Role changes, invitations and credit movements will appear here."
    />
  );
}

export function AuditLogError() {
  return (
    <EntityStateView
      icon={<AlertCircle className="size-8 text-destructive" />}
      title="Could not load the audit log"
      message="The platform admin API refused or is unreachable."
    />
  );
}
