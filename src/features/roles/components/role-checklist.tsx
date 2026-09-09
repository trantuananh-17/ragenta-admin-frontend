"use client";

import { LockIcon } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { AssignedRole } from "../service/roles.service";

/**
 * The roles a subject may hold, as a checklist.
 *
 * Shared by the two assignment dialogs because "which roles does this subject
 * hold" is the same question for a console account and for a workspace
 * membership. What differs is which set is offered and which entries are fixed —
 * a locked role is rendered rather than hidden, because a membership's built-in
 * role is part of the answer even though this screen cannot change it.
 */
export function RoleChecklist({
  roles,
  selected,
  lockedIds,
  onToggle,
  idPrefix,
}: {
  roles: AssignedRole[];
  selected: Set<string>;
  lockedIds?: Set<string>;
  onToggle: (roleId: string, checked: boolean) => void;
  idPrefix: string;
}) {
  return (
    <ul className="divide-y rounded-md border">
      {roles.map((role) => {
        const locked = lockedIds?.has(role.id) ?? false;

        return (
          <li key={role.id} className="flex items-start gap-3 px-3 py-2.5">
            <Checkbox
              id={`${idPrefix}-${role.id}`}
              className="mt-0.5"
              checked={locked || selected.has(role.id)}
              disabled={locked}
              onCheckedChange={(checked) => onToggle(role.id, checked === true)}
            />
            <div className="min-w-0 flex-1">
              <Label
                htmlFor={`${idPrefix}-${role.id}`}
                className="flex items-center gap-1.5 text-sm font-medium"
              >
                {role.name}
                {locked && <LockIcon className="size-3 text-muted-foreground" />}
              </Label>
              <p className="text-xs text-muted-foreground">
                {role.description || <span className="italic">No description.</span>}
              </p>
              <p className="font-mono text-xs text-muted-foreground/80">{role.key}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
