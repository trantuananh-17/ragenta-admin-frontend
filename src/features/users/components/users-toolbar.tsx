"use client";

import { useQueryStates } from "nuqs";

import { EntitySearch } from "@/components/entity-components";
import { usersParams } from "@/features/users/params";

export function UsersToolbar() {
  const [params, setParams] = useQueryStates(usersParams);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="min-w-[220px] max-w-sm flex-1">
        <EntitySearch
          value={params.search}
          onChange={(search) => setParams({ search, page: 1 })}
          placeholder="Search by name or email..."
        />
      </div>
    </div>
  );
}
