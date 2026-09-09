import { AlertCircle, ScrollText } from "lucide-react";

import {
  EntityStateView,
  EntityTableSkeleton,
} from "@/components/entity-components";

export function AuditLogLoading() {
  return <EntityTableSkeleton columns={6} />;
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
