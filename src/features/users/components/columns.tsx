"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { CopyButton } from "@/components/copy-button";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import {
  isPlatformAdmin,
  type AdminUser,
} from "@/features/users/service/users.service";
import { UserRowActions } from "./user-row-actions";

export const columns: ColumnDef<AdminUser>[] = [
  {
    accessorKey: "email",
    header: "User",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{row.original.name || "—"}</p>
        <p className="truncate text-xs text-muted-foreground">
          {row.original.email}
        </p>
      </div>
    ),
  },
  {
    id: "id",
    header: "ID",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.id.slice(0, 10)}…
        </span>
        <CopyButton value={row.original.id} />
      </div>
    ),
  },
  {
    id: "role",
    header: "Role",
    cell: ({ row }) =>
      isPlatformAdmin(row.original) ? (
        <StatusBadge tone="info">admin</StatusBadge>
      ) : (
        <StatusBadge>user</StatusBadge>
      ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      if (row.original.banned) {
        return <StatusBadge tone="danger">suspended</StatusBadge>;
      }
      return row.original.emailVerified ? (
        <StatusBadge tone="success">verified</StatusBadge>
      ) : (
        <StatusBadge tone="warning">unverified</StatusBadge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Signed up",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {formatDateTime(row.original.createdAt)}
      </span>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => <UserRowActions user={row.original} />,
  },
];
