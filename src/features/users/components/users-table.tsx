"use client";

import { useQueryStates } from "nuqs";

import { EntityDataTable } from "@/components/entity-components";
import { useUsersSuspense } from "@/features/users/hooks/users.hook";
import { usersParams } from "@/features/users/params";
import { columns } from "./columns";
import { UsersEmpty } from "./users-states";

export function UsersTable() {
  const [params] = useQueryStates(usersParams);
  const { data } = useUsersSuspense(params);

  return (
    <EntityDataTable
      columns={columns}
      data={data.items}
      emptyView={<UsersEmpty />}
      hasFilters={Boolean(params.search)}
    />
  );
}
