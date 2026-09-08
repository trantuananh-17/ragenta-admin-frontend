"use client";

import { useState } from "react";
import { AlertCircle, Loader2, Plus, ShieldCheck } from "lucide-react";

import { DetailShell } from "@/components/detail-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { usePermissionsSuspense, useRolesSuspense } from "../hooks/roles.hook";
import { NewRoleDialog } from "./new-role-dialog";
import { PermissionMatrix } from "./permission-matrix";

/**
 * Roles and what each one may do.
 *
 * Two panes rather than a list and a separate detail route: choosing a role is
 * a comparison — "does support see this and auditor not?" — and a round trip
 * through the router for every comparison makes the question harder to answer
 * than it is.
 */
export function RolesView() {
  const { data: roles } = useRolesSuspense();
  const { data: permissions } = usePermissionsSuspense();

  const [selectedId, setSelectedId] = useState<string | undefined>(() => roles[0]?.id);
  const [creating, setCreating] = useState(false);

  // A role deleted elsewhere, or the one just removed, leaves a selection that
  // no longer exists; fall back rather than render an empty pane.
  const selected = roles.find((role) => role.id === selectedId) ?? roles[0];

  const workspaceRoles = roles.filter((role) => role.scope === "workspace");
  const platformRoles = roles.filter((role) => role.scope === "platform");

  return (
    <DetailShell className="flex flex-col overflow-hidden">
      <PageHeader
        title="Roles"
        description="A role is a named set of permissions. Built-in roles come from the release; the ones you create here are yours to compose."
        info="Ragenta checks permissions, not role names. Adding a second role to somebody can only widen what they may do — narrowing one resource is a grant on that resource."
        actions={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            New role
          </Button>
        }
      />

      <div className="mt-6 grid min-h-0 flex-1 gap-4 lg:grid-cols-[18rem_1fr]">
        <nav className="flex flex-col gap-4 overflow-auto">
          <RoleGroup
            title="Workspace"
            roles={workspaceRoles}
            selectedId={selected?.id}
            onSelect={setSelectedId}
          />
          <RoleGroup
            title="Admin console"
            roles={platformRoles}
            selectedId={selected?.id}
            onSelect={setSelectedId}
          />
        </nav>

        <div className="flex min-h-0 flex-col rounded-md border bg-background">
          {selected ? (
            <PermissionMatrix
              // Remounting on the selected role is what reseeds the checkboxes
              // from that role's own set; copying them in from an effect would
              // render the previous role's answer first.
              key={selected.id}
              role={selected}
              permissions={permissions}
              onDeleted={() => setSelectedId(undefined)}
            />
          ) : (
            <p className="p-6 text-sm text-muted-foreground">
              No roles exist. That should not be possible — the built-in ones are written by the
              migration step on every deploy.
            </p>
          )}
        </div>
      </div>

      <NewRoleDialog
        open={creating}
        onOpenChange={setCreating}
        onCreated={(roleId) => setSelectedId(roleId)}
      />
    </DetailShell>
  );
}

function RoleGroup({
  title,
  roles,
  selectedId,
  onSelect,
}: {
  title: string;
  roles: { id: string; name: string; key: string; isSystem: boolean; permissions: string[] }[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}) {
  if (roles.length === 0) return null;

  return (
    <section className="space-y-1">
      <h2 className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <ul className="space-y-1">
        {roles.map((role) => (
          <li key={role.id}>
            <button
              type="button"
              onClick={() => onSelect(role.id)}
              className={cn(
                "w-full rounded-md border px-3 py-2 text-left transition-colors",
                role.id === selectedId
                  ? "border-primary bg-primary/5"
                  : "border-transparent hover:bg-muted/60",
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{role.name}</span>
                {role.isSystem && <StatusBadge tone="neutral">built in</StatusBadge>}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {role.permissions.length}{" "}
                {role.permissions.length === 1 ? "permission" : "permissions"}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function RolesLoading() {
  return (
    <DetailShell>
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading roles...
        </p>
      </div>
    </DetailShell>
  );
}

export function RolesError() {
  return (
    <DetailShell>
      <div className="flex flex-col items-center gap-2 rounded-md border p-10 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <p className="font-medium">Could not load roles</p>
        <p className="max-w-md text-sm text-muted-foreground">
          The platform admin API refused or is unreachable. Reading this screen needs the{" "}
          <code className="font-mono text-xs">admin.role.read</code> permission — an account that can
          open the console does not necessarily hold it.
        </p>
        <ShieldCheck className="mt-2 size-4 text-muted-foreground" />
      </div>
    </DetailShell>
  );
}
