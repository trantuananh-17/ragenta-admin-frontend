"use client";

import { useRouter } from "next/navigation";
import { useQueryStates } from "nuqs";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertCircle, Loader2, RotateCcw, Sparkles } from "lucide-react";

import { ContentStatusFilter } from "@/components/content-status-filter";
import {
  EntityContainer,
  EntityDataTable,
  EntityHeader,
  EntityPagination,
  EntitySearch,
  EntityStateView,
} from "@/components/entity-components";
import { ContentStatusBadge, StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useCatalogueSuspense } from "@/features/catalogue/hooks/catalogue.hook";
import { catalogueParams } from "@/features/catalogue/params";
import type { CatalogueItem } from "@/features/catalogue/service/catalogue.service";
import { formatNumber } from "@/lib/format";
import { DEFAULT_LOCALE, pickText } from "@/lib/locale";

const columns: ColumnDef<CatalogueItem>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{row.original.name}</p>
        <p className="truncate font-mono text-xs text-muted-foreground">
          {row.original.slug}
        </p>
      </div>
    ),
  },
  {
    id: "description",
    header: "Description",
    cell: ({ row }) => (
      <p className="line-clamp-2 max-w-md text-xs text-muted-foreground">
        {pickText(row.original.description, DEFAULT_LOCALE) || "—"}
      </p>
    ),
  },
  {
    id: "featured",
    header: "Featured",
    cell: ({ row }) =>
      row.original.featured ? (
        <StatusBadge tone="info">featured</StatusBadge>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: "sortOrder",
    header: "Order",
    cell: ({ row }) => (
      <span className="font-mono text-xs tabular-nums">
        {row.original.sortOrder}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => <ContentStatusBadge status={row.original.status} />,
  },
];

export function CatalogueLoading() {
  return (
    <EntityStateView
      icon={<Loader2 className="size-8 animate-spin text-muted-foreground" />}
      title="Loading the catalogue..."
    />
  );
}

export function CatalogueEmpty() {
  return (
    <EntityStateView
      icon={<Sparkles className="size-8 text-muted-foreground" />}
      title="Nothing in the catalogue"
      message="Models, tools and connectors listed here appear in the site's Models and tools section."
    />
  );
}

export function CatalogueError() {
  return (
    <EntityStateView
      icon={<AlertCircle className="size-8 text-destructive" />}
      title="Could not load the catalogue"
      message="The content backend refused or is unreachable."
    />
  );
}

function CatalogueToolbar() {
  const [params, setParams] = useQueryStates(catalogueParams);
  const hasFilters = Boolean(params.search || params.status);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="min-w-[220px] max-w-sm flex-1">
        <EntitySearch
          value={params.search}
          onChange={(search) => setParams({ search, page: 1 })}
          placeholder="Search by name, slug or description..."
        />
      </div>
      <ContentStatusFilter
        value={params.status}
        onChange={(status) => setParams({ status, page: 1 })}
      />
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setParams({ search: null, status: null, page: 1 })}
        >
          <RotateCcw className="size-4" />
          Clear
        </Button>
      )}
    </div>
  );
}

function CataloguePagination() {
  const [params, setParams] = useQueryStates(catalogueParams);
  const { data } = useCatalogueSuspense(params);

  return (
    <EntityPagination
      page={data.pagination.page}
      totalPages={data.pagination.totalPages}
      onPageChange={(page) => setParams({ page })}
      infoText={`${formatNumber(data.pagination.total)} items`}
    />
  );
}

export function CatalogueTable() {
  const router = useRouter();
  const [params] = useQueryStates(catalogueParams);
  const { data } = useCatalogueSuspense(params);

  return (
    <EntityDataTable
      columns={columns}
      data={data.data}
      emptyView={<CatalogueEmpty />}
      hasFilters={Boolean(params.search || params.status)}
      onRowClick={(row) => router.push(`/admin/content/catalogue/${row.id}`)}
    />
  );
}

export function CatalogueContainer({ children }: { children: React.ReactNode }) {
  return (
    <EntityContainer
      header={
        <EntityHeader
          title="Catalogue"
          description="Models, tools and connectors in the site's Models and tools section. Featured items sort first."
          newButtonHref="/admin/content/catalogue/new"
          newButtonLabel="New item"
        />
      }
      search={<CatalogueToolbar />}
      pagination={<CataloguePagination />}
    >
      {children}
    </EntityContainer>
  );
}
