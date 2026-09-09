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
import { useSetUserPlatformRoles, useUserPlatformRoles } from "../hooks/users.hook";
import { isPlatformAdmin, type AdminUser } from "../service/users.service";

/**
 * Which of the four platform roles a console account holds.
 *
 * The account menu's "Make platform admin" writes Better Auth's `user.role` and
 * is all-or-nothing; this is the graduated version, and the one the backend
 * resolves permissions from. Both are shown because both are real: an account
 * carrying the Better Auth flag keeps every permission whatever is ticked here,
 * and an operator who does not know that will think this screen is broken.
 */
export function PlatformRolesDialog({
  user,
  open,
  onOpenChange,
}: {
  user: AdminUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const roles = useQuery({ ...rolesOptions.list(), enabled: open });
  const held = useUserPlatformRoles(user.id, open);
  const save = useSetUserPlatformRoles(user.id);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [seededFrom, setSeededFrom] = useState<AssignedRole[] | undefined>();
  const [wasOpen, setWasOpen] = useState(open);

  // Seeded from what the account holds, during render rather than in an effect,
  // so the checklist never paints last time's selection first. Reopening clears
  // the seed so a stale tick cannot survive a cancelled edit.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setSeededFrom(undefined);
  }
  if (open && held.data && held.data !== seededFrom) {
    setSeededFrom(held.data);
    setSelected(new Set(held.data.map((role) => role.id)));
  }

  const platformRoles = (roles.data ?? []).filter((role) => role.scope === "platform");
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
          <DialogTitle>Platform roles</DialogTitle>
          <DialogDescription>
            What {user.email} may do in this console. A role is the whole set of
            permissions it carries — the Roles screen is where that set is read.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Spinner />
            Loading roles...
          </div>
        ) : (
          <RoleChecklist
            roles={platformRoles}
            selected={selected}
            onToggle={toggle}
            idPrefix={`platform-${user.id}`}
          />
        )}

        {isPlatformAdmin(user) && (
          <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            This account is also a platform admin through Better Auth&apos;s own flag,
            which grants every permission regardless of what is ticked here. Use
            <strong> Revoke platform admin</strong> if these roles are meant to be the
            only thing it holds.
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
            disabled={!dirty || save.isPending}
            onClick={() =>
              save.mutate([...selected], { onSuccess: () => onOpenChange(false) })
            }
          >
            {save.isPending ? "Saving..." : "Save roles"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
