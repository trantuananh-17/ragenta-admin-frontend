"use client";

import { useState } from "react";
import { MoreVerticalIcon } from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useBanUser,
  useRevokeUserSessions,
  useSetUserRole,
  useUnbanUser,
} from "@/features/users/hooks/users.hook";
import {
  isPlatformAdmin,
  type AdminUser,
} from "@/features/users/service/users.service";

type PendingAction = "grant-admin" | "revoke-admin" | "ban" | "unban" | "sessions";

/**
 * Every one of these is irreversible from the person's point of view — a
 * suspension logs them out, a revoked session ends work in progress — so all of
 * them confirm, and the confirmation names the account.
 */
export function UserRowActions({ user }: { user: AdminUser }) {
  const [action, setAction] = useState<PendingAction | null>(null);
  const [banReason, setBanReason] = useState("");

  const setRole = useSetUserRole();
  const ban = useBanUser();
  const unban = useUnbanUser();
  const revokeSessions = useRevokeUserSessions();

  const isAdmin = isPlatformAdmin(user);
  const pending =
    setRole.isPending || ban.isPending || unban.isPending || revokeSessions.isPending;

  const close = () => {
    setAction(null);
    setBanReason("");
  };

  const confirm = () => {
    const done = { onSuccess: close };
    if (action === "grant-admin") {
      setRole.mutate({ userId: user.id, role: "admin" }, done);
    } else if (action === "revoke-admin") {
      setRole.mutate({ userId: user.id, role: "user" }, done);
    } else if (action === "ban") {
      ban.mutate({ userId: user.id, reason: banReason.trim() || "Suspended by an administrator." }, done);
    } else if (action === "unban") {
      unban.mutate({ userId: user.id }, done);
    } else if (action === "sessions") {
      revokeSessions.mutate({ userId: user.id }, done);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <MoreVerticalIcon className="size-4" />
            <span className="sr-only">Actions for {user.email}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isAdmin ? (
            <DropdownMenuItem onSelect={() => setAction("revoke-admin")}>
              Revoke platform admin
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => setAction("grant-admin")}>
              Make platform admin
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => setAction("sessions")}>
            Revoke all sessions
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {user.banned ? (
            <DropdownMenuItem onSelect={() => setAction("unban")}>
              Restore account
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setAction("ban")}
            >
              Suspend account
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={action === "grant-admin"}
        onOpenChange={(open) => !open && close()}
        title="Grant platform admin"
        description={`${user.email} will be able to read every workspace, adjust credits and change plans.`}
        confirmLabel="Grant"
        pending={pending}
        onConfirm={confirm}
      />

      <ConfirmDialog
        open={action === "revoke-admin"}
        onOpenChange={(open) => !open && close()}
        title="Revoke platform admin"
        description={`${user.email} keeps their workspaces but loses this console.`}
        confirmLabel="Revoke"
        destructive
        pending={pending}
        onConfirm={confirm}
      />

      <ConfirmDialog
        open={action === "sessions"}
        onOpenChange={(open) => !open && close()}
        title="Revoke all sessions"
        description={`${user.email} is signed out everywhere and has to sign in again.`}
        confirmLabel="Revoke"
        destructive
        pending={pending}
        onConfirm={confirm}
      />

      <ConfirmDialog
        open={action === "ban"}
        onOpenChange={(open) => !open && close()}
        title="Suspend account"
        description={
          <span className="space-y-3">
            <span className="block">
              {user.email} can no longer sign in, and every current session stops
              working.
            </span>
            <span className="block space-y-1">
              <Label htmlFor="ban-reason" className="text-xs">
                Reason (stored on the account)
              </Label>
              <Input
                id="ban-reason"
                value={banReason}
                onChange={(event) => setBanReason(event.target.value)}
                placeholder="Abuse report #1234"
              />
            </span>
          </span>
        }
        confirmLabel="Suspend"
        destructive
        pending={pending}
        onConfirm={confirm}
      />

      <ConfirmDialog
        open={action === "unban"}
        onOpenChange={(open) => !open && close()}
        title="Restore account"
        description={`${user.email} can sign in again.`}
        confirmLabel="Restore"
        pending={pending}
        onConfirm={confirm}
      />
    </>
  );
}
