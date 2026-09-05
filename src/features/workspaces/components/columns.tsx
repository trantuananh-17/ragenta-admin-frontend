"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

import { formatCredits, formatDateTime } from "@/lib/format";
import type { AdminWorkspace } from "@/features/workspaces/service/workspaces.service";
import { PlanBadge, SubscriptionStatusBadge } from "./plan-badge";

export const columns: ColumnDef<AdminWorkspace>[] = [
  {
    accessorKey: "name",
    header: "Workspace",
    cell: ({ row }) => (
      <div className="min-w-0">
        <Link
          href={`/admin/workspaces/${row.original.id}`}
          className="truncate font-medium hover:underline"
          prefetch
        >
          {row.original.name}
        </Link>
        <p className="truncate font-mono text-xs text-muted-foreground">
          {row.original.slug}
        </p>
      </div>
    ),
  },
  {
    id: "plan",
    header: "Plan",
    cell: ({ row }) => <PlanBadge plan={row.original.plan} />,
  },
  {
    id: "subscriptionStatus",
    header: "Subscription",
    cell: ({ row }) => (
      <SubscriptionStatusBadge status={row.original.subscriptionStatus} />
    ),
  },
  {
    id: "credits",
    header: "Credits",
    cell: ({ row }) => {
      const plan = row.original.planCredits ?? 0;
      const topup = row.original.topupCredits ?? 0;
      return (
        <div className="tabular-nums">
          <p className="text-sm">{formatCredits(plan + topup)}</p>
          <p className="text-xs text-muted-foreground">
            plan {formatCredits(plan)} · top-up {formatCredits(topup)}
          </p>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {formatDateTime(row.original.createdAt)}
      </span>
    ),
  },
];
