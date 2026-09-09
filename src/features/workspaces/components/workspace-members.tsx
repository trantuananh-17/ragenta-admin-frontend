"use client";

import Link from "next/link";
import { useState } from "react";
import { ShieldIcon } from "lucide-react";

import { DetailSection } from "@/components/detail-shell";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { useWorkspaceMembersSuspense } from "../hooks/workspaces.hook";
import type { WorkspaceMember } from "../service/workspaces.service";
import { MemberRolesDialog } from "./member-roles-dialog";

/**
 * Who is in the workspace, and what each of them may do.
 *
 * The built-in role in the table is `member.role` — the column Better Auth
 * resolves its own membership endpoints through. The dialog is where the roles
 * beside it are composed, which is what the workspace's permissions are actually
 * answered from (ADR-046).
 */
export function WorkspaceMembers({ workspaceId }: { workspaceId: string }) {
  const { data: members } = useWorkspaceMembersSuspense(workspaceId);
  const [editing, setEditing] = useState<WorkspaceMember | null>(null);

  return (
    <DetailSection
      title="Members"
      description="A membership holds a set of roles. The effective permissions are their union."
    >
      {members.length === 0 ? (
        <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
          This workspace has no members.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Built-in role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <Link
                      href={`/admin/users?search=${encodeURIComponent(member.email)}`}
                      className="font-medium hover:underline"
                    >
                      {member.name || member.email}
                    </Link>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </TableCell>
                  <TableCell>
                    <StatusBadge tone="neutral">{member.role}</StatusBadge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(member.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(member)}
                    >
                      <ShieldIcon className="size-4" />
                      Roles
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {editing && (
        <MemberRolesDialog
          workspaceId={workspaceId}
          member={editing}
          open
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </DetailSection>
  );
}
