"use client";

import { EntityContainer, EntityHeader } from "@/components/entity-components";
import { UsersPagination } from "./users-pagination";
import { UsersToolbar } from "./users-toolbar";

export function UsersContainer({ children }: { children: React.ReactNode }) {
  return (
    <EntityContainer
      header={
        <EntityHeader
          title="Users"
          description="Every account on the platform. Roles, suspensions and sessions are Better Auth operations."
        />
      }
      search={<UsersToolbar />}
      pagination={<UsersPagination />}
    >
      {children}
    </EntityContainer>
  );
}
