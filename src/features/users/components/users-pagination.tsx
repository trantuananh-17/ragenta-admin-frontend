"use client";

import { useQueryStates } from "nuqs";

import { EntityPagination } from "@/components/entity-components";
import { useUsersSuspense } from "@/features/users/hooks/users.hook";
import { usersParams } from "@/features/users/params";
import { formatNumber } from "@/lib/format";
import { totalPages } from "@/lib/pagination";

export function UsersPagination() {
  const [params, setParams] = useQueryStates(usersParams);
  const { data } = useUsersSuspense(params);

  return (
    <EntityPagination
      page={params.page}
      totalPages={totalPages(data.total, data.limit)}
      onPageChange={(page) => setParams({ page })}
      infoText={`${formatNumber(data.total)} accounts`}
    />
  );
}
