"use client";

import Link from "next/link";
import { useState } from "react";
import { useQueryStates } from "nuqs";
import type { ColumnDef } from "@tanstack/react-table";
import { RotateCcw } from "lucide-react";

import { CopyButton } from "@/components/copy-button";
import {
  EntityContainer,
  EntityDataTable,
  EntityHeader,
  EntityPagination,
} from "@/components/entity-components";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuditLogSuspense } from "@/features/audit-log/hooks/audit-log.hook";
import { auditLogParams } from "@/features/audit-log/params";
import type { AuditEntry } from "@/features/audit-log/service/audit-log.service";
import { formatDateTime, formatNumber } from "@/lib/format";
import { totalPages } from "@/lib/pagination";
import { AuditLogEmpty } from "./audit-log-states";

const columns: ColumnDef<AuditEntry>[] = [
  {
    accessorKey: "createdAt",
    header: "When",
    cell: ({ row }) => (
      <span className="font-mono text-xs whitespace-nowrap">
        {formatDateTime(row.original.createdAt)}
      </span>
    ),
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.action}</span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge tone={row.original.status === "success" ? "success" : "danger"}>
        {row.original.status}
      </StatusBadge>
    ),
  },
  {
    id: "workspace",
    header: "Workspace",
    cell: ({ row }) =>
      row.original.organizationId ? (
        <Link
          href={`/admin/workspaces/${row.original.organizationId}`}
          className="font-mono text-xs hover:underline"
          onClick={(event) => event.stopPropagation()}
        >
          {row.original.organizationId.slice(0, 12)}…
        </Link>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
  },
  {
    id: "actor",
    header: "Actor",
    cell: ({ row }) =>
      row.original.actorId ? (
        <div className="flex items-center gap-1">
          <span className="font-mono text-xs">
            {row.original.actorId.slice(0, 12)}…
          </span>
          <CopyButton value={row.original.actorId} />
        </div>
      ) : (
        // The column is nulled on user delete so the trail survives the account.
        <span className="text-xs text-muted-foreground">deleted account</span>
      ),
  },
  {
    id: "target",
    header: "Target",
    cell: ({ row }) =>
      row.original.targetType ? (
        <span className="text-xs">
          {row.original.targetType}
          {row.original.targetId && (
            <span className="text-muted-foreground">
              {" "}
              {row.original.targetId.slice(0, 10)}…
            </span>
          )}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
  },
];

function AuditLogToolbar() {
  const [params, setParams] = useQueryStates(auditLogParams);
  const hasFilters = Boolean(params.workspaceId || params.actorId || params.action);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        className="max-w-[240px]"
        placeholder="Action, e.g. billing.credits.granted"
        value={params.action}
        onChange={(event) =>
          setParams({ action: event.target.value || null, page: 1 })
        }
      />
      <Input
        className="max-w-[220px]"
        placeholder="Workspace id"
        value={params.workspaceId}
        onChange={(event) =>
          setParams({ workspaceId: event.target.value || null, page: 1 })
        }
      />
      <Input
        className="max-w-[220px]"
        placeholder="Actor id"
        value={params.actorId}
        onChange={(event) =>
          setParams({ actorId: event.target.value || null, page: 1 })
        }
      />
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            setParams({ action: null, workspaceId: null, actorId: null, page: 1 })
          }
        >
          <RotateCcw className="size-4" />
          Clear
        </Button>
      )}
    </div>
  );
}

function AuditLogPagination() {
  const [params, setParams] = useQueryStates(auditLogParams);
  const { data } = useAuditLogSuspense(params);

  return (
    <EntityPagination
      page={params.page}
      totalPages={totalPages(data.total, data.limit)}
      onPageChange={(page) => setParams({ page })}
      infoText={`${formatNumber(data.total)} entries`}
    />
  );
}

export function AuditLogTable() {
  const [params] = useQueryStates(auditLogParams);
  const { data } = useAuditLogSuspense(params);
  const [selected, setSelected] = useState<AuditEntry | null>(null);

  return (
    <>
      <EntityDataTable
        columns={columns}
        data={data.items}
        emptyView={<AuditLogEmpty />}
        hasFilters={Boolean(params.action || params.workspaceId || params.actorId)}
        onRowClick={setSelected}
      />

      <Dialog open={selected !== null} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">
              {selected?.action}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground uppercase">When</dt>
                  <dd>{formatDateTime(selected.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground uppercase">
                    IP address
                  </dt>
                  <dd className="font-mono text-xs">
                    {selected.ipAddress ?? "—"}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-foreground uppercase">
                    User agent
                  </dt>
                  <dd className="text-xs break-all">
                    {selected.userAgent ?? "—"}
                  </dd>
                </div>
              </dl>
              <div>
                <p className="mb-1 text-xs text-muted-foreground uppercase">
                  Metadata
                </p>
                <pre className="max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs">
                  {JSON.stringify(selected.metadata ?? {}, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AuditLogContainer({ children }: { children: React.ReactNode }) {
  return (
    <EntityContainer
      header={
        <EntityHeader
          title="Audit log"
          description="Append-only record of security- and money-relevant actions. Nothing here can be edited or deleted."
        />
      }
      search={<AuditLogToolbar />}
      pagination={<AuditLogPagination />}
    >
      {children}
    </EntityContainer>
  );
}
