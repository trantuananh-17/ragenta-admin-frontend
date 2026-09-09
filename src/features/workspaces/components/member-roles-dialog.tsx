"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { RoleChecklist } from "@/features/roles/components/role-checklist";
import { rolesOptions } from "@/features/roles/options/roles.options";
import type { AssignedRole } from "@/features/roles/service/roles.service";
import { useMemberRoles, useSetMemberRoles } from "../hooks/workspaces.hook";
import type { WorkspaceMember } from "../service/workspaces.service";

/**
 * The roles one membership holds.
 *
 * The built-in role is shown locked rather than hidden: it is half the answer to
 * "what may this person do", but it follows Better Auth's `member.role` and this
 * endpoint is not that column's writer (ADR-053). What this screen composes is
 * the roles beside it.
 */
export function MemberRolesDialog({
  workspaceId,
  member,
  open,
  onOpenChange,
}: {
  workspaceId: string;
  member: WorkspaceMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const roles = useQuery({ ...rolesOptions.list(workspaceId), enabled: open });
  const held = useMemberRoles(workspaceId, member.id, open);
  const save = useSetMemberRoles(workspaceId, member.id);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [seededFrom, setSeededFrom] = useState<AssignedRole[] | undefined>();
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setSeededFrom(undefined);
  }
  if (open && held.data && held.data !== seededFrom) {
    setSeededFrom(held.data);
    setSelected(new Set(held.data.map((role) => role.id)));
  }

  const builtIn = held.data?.find((role) => role.isSystem);
  const composable = (roles.data ?? []).filter(
    (role) => role.scope === "workspace" && !role.isSystem,
  );
  const offered = builtIn ? [builtIn, ...composable] : composable;

  const loading = roles.isPending || held.isPending;
  const dirty =
    held.data !== undefined &&
    (selected.size !== held.data.length ||
      held.data.some((role) => !selected.has(role.id)));

  function toggle(roleId: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(roleId);
      else next.delete(roleId);
      return next;
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Member roles</DialogTitle>
          <DialogDescription>
            What {member.email} may do in this workspace. The effective permission
            set is the union of every role ticked here.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Spinner />
            Loading roles...
          </div>
        ) : offered.length === 0 ? (
          <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
            No roles to compose yet. Create one on the Roles screen with scope
            <strong> Workspace</strong>, then assign it here.
          </p>
        ) : (
          <RoleChecklist
            roles={offered}
            selected={selected}
            lockedIds={builtIn ? new Set([builtIn.id]) : undefined}
            onToggle={toggle}
            idPrefix={`member-${member.id}`}
          />
        )}

        {!loading && !builtIn && (
          <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            This membership holds no built-in role, which the backend requires
            before it will accept a change. It is normally granted by the seeder on
            migrate — report it rather than working around it.
          </p>
        )}

        {builtIn && (
          <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <strong>{builtIn.name}</strong> is this membership&apos;s built-in role and
            cannot be changed here — it follows <code>member.role</code>, which the
            workspace&apos;s own members screen owns.
          </p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={save.isPending}
          >
            Cancel
          </Button>
          <Button
            disabled={!dirty || !builtIn || save.isPending}
            onClick={() =>
              save.mutate([...selected], { onSuccess: () => onOpenChange(false) })
            }
          >
            {save.isPending && <Spinner data-icon="inline-start" />}
            Save roles
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
