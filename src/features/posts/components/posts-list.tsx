"use client";

import { useRouter } from "next/navigation";
import { useQueryStates } from "nuqs";
import type { ColumnDef } from "@tanstack/react-table";
import { RotateCcw } from "lucide-react";

import { ContentStatusFilter } from "@/components/content-status-filter";
import {
  EntityContainer,
  EntityDataTable,
  EntityHeader,
  EntityPagination,
  EntitySearch,
} from "@/components/entity-components";
import { ContentStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { usePostsSuspense } from "@/features/posts/hooks/posts.hook";
import { postsParams } from "@/features/posts/params";
import type { PostRow } from "@/features/posts/service/posts.service";
import { formatDateTime, formatNumber } from "@/lib/format";
import { totalPages } from "@/lib/pagination";
import { PostsEmpty } from "./posts-states";

const columns: ColumnDef<PostRow>[] = [
  {
    accessorKey: "slug",
    header: "Slug",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.slug}</span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => <ContentStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "publishedAt",
    header: "Published",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {formatDateTime(row.original.publishedAt)}
      </span>
    ),
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

function PostsToolbar() {
  const [params, setParams] = useQueryStates(postsParams);
  const hasFilters = Boolean(params.search || params.status);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="min-w-[220px] max-w-sm flex-1">
        <EntitySearch
          value={params.search}
          onChange={(search) => setParams({ search, page: 1 })}
          placeholder="Search by slug..."
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

function PostsPagination() {
  const [params, setParams] = useQueryStates(postsParams);
  const { data } = usePostsSuspense(params);

  return (
    <EntityPagination
      page={params.page}
      totalPages={totalPages(data.total, data.limit)}
      onPageChange={(page) => setParams({ page })}
      infoText={`${formatNumber(data.total)} posts`}
    />
  );
}

export function PostsTable() {
  const router = useRouter();
  const [params] = useQueryStates(postsParams);
  const { data } = usePostsSuspense(params);

  return (
    <EntityDataTable
      columns={columns}
      data={data.items}
      emptyView={<PostsEmpty />}
      hasFilters={Boolean(params.search || params.status)}
      onRowClick={(row) => router.push(`/admin/content/posts/${row.id}`)}
    />
  );
}

export function PostsContainer({ children }: { children: React.ReactNode }) {
  return (
    <EntityContainer
      header={
        <EntityHeader
          title="Blog posts"
          description="What the marketing site renders at /blog. English is required; Vietnamese falls back to it."
          newButtonHref="/admin/content/posts/new"
          newButtonLabel="New post"
        />
      }
      search={<PostsToolbar />}
      pagination={<PostsPagination />}
    >
      {children}
    </EntityContainer>
  );
}
