"use client";

import { useMemo, useState } from "react";
import { Lock, Save, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useDeleteRole, useUpdateRole } from "../hooks/roles.hook";
import { groupByResource, type Permission, type Role } from "../service/roles.service";

/**
 * What one role may do, as the catalogue laid out by resource.
 *
 * Every permission in the role's scope is rendered, including the ones it does
 * not hold — a matrix that showed only what was granted would make "this role
 * cannot do X" indistinguishable from "X does not exist", which is the question
 * somebody opens this screen to answer.
 *
 * A built-in role is read-only and says why. The migration step reconciles its
 * permissions to the release on every deploy (ADR-046), so an editable checkbox
 * here would be a control whose effect disappears at the next release.
 */
export function PermissionMatrix({
  role,
  permissions,
  onDeleted,
}: {
  role: Role;
  permissions: Permission[];
  onDeleted: () => void;
}) {
  const inScope = useMemo(
    () => permissions.filter((permission) => permission.scope === role.scope),
    [permissions, role.scope],
  );

  const [selected, setSelected] = useState<Set<string>>(() => new Set(role.permissions));
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const update = useUpdateRole();
  const remove = useDeleteRole();

  const dirty =
    selected.size !== role.permissions.length ||
    role.permissions.some((key) => !selected.has(key));

  function toggle(key: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function toggleGroup(group: Permission[], checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      for (const permission of group) {
        if (checked) next.add(permission.key);
        else next.delete(permission.key);
      }
      return next;
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold">{role.name}</h2>
            <StatusBadge tone={role.scope === "platform" ? "info" : "neutral"}>
              {role.scope}
            </StatusBadge>
            {role.isSystem && (
              <StatusBadge tone="warning">
                <Lock className="mr-1 size-3" />
                built in
              </StatusBadge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {role.description || <span className="italic">No description.</span>}
          </p>
          <p className="font-mono text-xs text-muted-foreground">{role.key}</p>
        </div>

        <div className="flex items-center gap-2">
          {!role.isSystem && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmingDelete(true)}
              disabled={remove.isPending}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          )}
          <Button
            size="sm"
            disabled={!dirty || role.isSystem || update.isPending}
            onClick={() =>
              update.mutate({ roleId: role.id, input: { permissions: [...selected] } })
            }
          >
            <Save className="size-4" />
            {update.isPending && <Spinner data-icon="inline-start" />}
            Save
          </Button>
        </div>
      </div>

      {role.isSystem && (
        <p className="border-b bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
          A built-in role is defined by the release and reset on every deploy. To change what
          somebody may do, create a role instead.
        </p>
      )}

      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groupByResource(inScope).map(([resource, group]) => {
            const all = group.every((permission) => selected.has(permission.key));
            const some = !all && group.some((permission) => selected.has(permission.key));

            return (
              <section key={resource} className="rounded-md border">
                <header className="flex items-center gap-2 border-b bg-muted/30 px-3 py-2">
                  <Checkbox
                    id={`${role.id}-${resource}`}
                    checked={all ? true : some ? "indeterminate" : false}
                    disabled={role.isSystem}
                    onCheckedChange={(checked) => toggleGroup(group, checked === true)}
                  />
                  <Label
                    htmlFor={`${role.id}-${resource}`}
                    className="font-mono text-xs font-medium"
                  >
                    {resource}
                  </Label>
                </header>

                <ul className="divide-y">
                  {group.map((permission) => (
                    <li key={permission.key} className="flex items-start gap-2 px-3 py-2">
                      <Checkbox
                        id={`${role.id}-${permission.key}`}
                        className="mt-0.5"
                        checked={selected.has(permission.key)}
                        disabled={role.isSystem}
                        onCheckedChange={(checked) => toggle(permission.key, checked === true)}
                      />
                      <div className="min-w-0">
                        <Label
                          htmlFor={`${role.id}-${permission.key}`}
                          className="block font-mono text-xs"
                        >
                          {permission.action}
                        </Label>
                        <p className="text-xs text-muted-foreground">{permission.description}</p>
                        {permission.grantableOn && (
                          <p className="text-xs text-muted-foreground/80">
                            Can also be granted on one {permission.grantableOn}.
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title={`Delete ${role.name}?`}
        description="The role is removed from the catalogue. Anybody currently holding it must be reassigned first — the backend refuses otherwise rather than silently taking their access away."
        confirmLabel="Delete role"
        destructive
        pending={remove.isPending}
        onConfirm={() =>
          remove.mutate(
            { roleId: role.id },
            {
              onSuccess: () => {
                setConfirmingDelete(false);
                onDeleted();
              },
            },
          )
        }
      />
    </div>
  );
}
