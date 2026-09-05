"use client";

import { useRouter } from "next/navigation";
import { useQueryStates } from "nuqs";

import {
  EntityContainer,
  EntityDataTable,
  EntityHeader,
  EntityPagination,
  EntitySearch,
} from "@/components/entity-components";
import { useWorkspacesSuspense } from "@/features/workspaces/hooks/workspaces.hook";
import { workspacesParams } from "@/features/workspaces/params";
import { formatNumber } from "@/lib/format";
import { totalPages } from "@/lib/pagination";
import { columns } from "./columns";
import { WorkspacesEmpty } from "./workspaces-states";

function WorkspacesToolbar() {
  const [params, setParams] = useQueryStates(workspacesParams);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="min-w-[220px] max-w-sm flex-1">
        <EntitySearch
          value={params.search}
          onChange={(search) => setParams({ search, page: 1 })}
          placeholder="Search by name or slug..."
        />
      </div>
    </div>
  );
}

function WorkspacesPagination() {
  const [params, setParams] = useQueryStates(workspacesParams);
  const { data } = useWorkspacesSuspense(params);

  return (
    <EntityPagination
      page={params.page}
      totalPages={totalPages(data.total, data.limit)}
      onPageChange={(page) => setParams({ page })}
      infoText={`${formatNumber(data.total)} workspaces`}
    />
  );
}

export function WorkspacesTable() {
  const router = useRouter();
  const [params] = useQueryStates(workspacesParams);
  const { data } = useWorkspacesSuspense(params);

  return (
    <EntityDataTable
      columns={columns}
      data={data.items}
      emptyView={<WorkspacesEmpty />}
      hasFilters={Boolean(params.search)}
      onRowClick={(row) => router.push(`/admin/workspaces/${row.id}`)}
    />
  );
}

export function WorkspacesContainer({ children }: { children: React.ReactNode }) {
  return (
    <EntityContainer
      header={
        <EntityHeader
          title="Workspaces"
          description="Every tenant on the platform, with its plan and credit balance."
        />
      }
      search={<WorkspacesToolbar />}
      pagination={<WorkspacesPagination />}
    >
      {children}
    </EntityContainer>
  );
}
