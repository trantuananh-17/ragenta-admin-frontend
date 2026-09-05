"use client";

import { useRouter } from "next/navigation";
import { useQueryStates } from "nuqs";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertCircle, Loader2, RotateCcw, ScrollText } from "lucide-react";

import { ContentStatusFilter } from "@/components/content-status-filter";
import {
  EntityContainer,
  EntityDataTable,
  EntityHeader,
  EntityPagination,
  EntityStateView,
} from "@/components/entity-components";
import { ContentStatusBadge, StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useChangelogSuspense } from "@/features/changelog/hooks/changelog.hook";
import { changelogParams } from "@/features/changelog/params";
import type { ChangelogRow } from "@/features/changelog/service/changelog.service";
import { formatDateTime, formatNumber } from "@/lib/format";
import { totalPages } from "@/lib/pagination";

const columns: ColumnDef<ChangelogRow>[] = [
  {
    accessorKey: "entryDate",
    header: "Date",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.entryDate}</span>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => <StatusBadge tone="info">{row.original.type}</StatusBadge>,
  },
  {
    accessorKey: "version",
    header: "Version",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.version ?? "—"}</span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => <ContentStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "updatedAt",
    header: "Last edited",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {formatDateTime(row.original.updatedAt)}
      </span>
    ),
  },
];

export function ChangelogLoading() {
  return (
    <EntityStateView
      icon={<Loader2 className="size-8 animate-spin text-muted-foreground" />}
      title="Loading the changelog..."
    />
  );
}

export function ChangelogEmpty() {
  return (
    <EntityStateView
      icon={<ScrollText className="size-8 text-muted-foreground" />}
      title="No entries yet"
      message="Release notes appear on /changelog once they are published."
    />
  );
}

export function ChangelogError() {
  return (
    <EntityStateView
      icon={<AlertCircle className="size-8 text-destructive" />}
      title="Could not load the changelog"
      message="The content backend refused or is unreachable."
    />
  );
}

function ChangelogToolbar() {
  const [params, setParams] = useQueryStates(changelogParams);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <ContentStatusFilter
        value={params.status}
        onChange={(status) => setParams({ status, page: 1 })}
      />
      {params.status && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setParams({ status: null, page: 1 })}
        >
          <RotateCcw className="size-4" />
          Clear
        </Button>
      )}
    </div>
  );
}

function ChangelogPagination() {
  const [params, setParams] = useQueryStates(changelogParams);
  const { data } = useChangelogSuspense(params);

  return (
    <EntityPagination
      page={params.page}
      totalPages={totalPages(data.total, data.limit)}
      onPageChange={(page) => setParams({ page })}
      infoText={`${formatNumber(data.total)} entries`}
    />
  );
}

export function ChangelogTable() {
  const router = useRouter();
  const [params] = useQueryStates(changelogParams);
  const { data } = useChangelogSuspense(params);

  return (
    <EntityDataTable
      columns={columns}
      data={data.items}
      emptyView={<ChangelogEmpty />}
      hasFilters={Boolean(params.status)}
      onRowClick={(row) => router.push(`/admin/content/changelog/${row.id}`)}
    />
  );
}

export function ChangelogContainer({ children }: { children: React.ReactNode }) {
  return (
    <EntityContainer
      header={
        <EntityHeader
          title="Changelog"
          description="Release notes on /changelog, and the compact strip on the home and product pages."
          newButtonHref="/admin/content/changelog/new"
          newButtonLabel="New entry"
        />
      }
      search={<ChangelogToolbar />}
      pagination={<ChangelogPagination />}
    >
      {children}
    </EntityContainer>
  );
}
