import { z } from "zod";

import { api } from "@/lib/ky";

/**
 * `/v1/admin/roles` and `/v1/admin/permissions` — the RBAC surface (ADR-046..050).
 *
 * `scope` and `grantableOn` are read as plain strings rather than as a `z.enum`.
 * A strict enum here has taken this console down before: adding `rerank` to the
 * backend's model capabilities threw at parse time and the screen reported "the
 * backend refused or is unreachable" while the backend was answering 200. A
 * backend that is ahead of this bundle during a rollout should cost one odd
 * table cell, not a dead page.
 */
export const permissionSchema = z.object({
  key: z.string(),
  scope: z.string(),
  resource: z.string(),
  action: z.string(),
  description: z.string(),
  grantableOn: z.string().nullable(),
});

export const roleSchema = z.object({
  id: z.string(),
  organizationId: z.string().nullable(),
  scope: z.string(),
  key: z.string(),
  name: z.string(),
  description: z.string(),
  isSystem: z.boolean(),
  createdAt: z.coerce.string(),
  permissions: z.array(z.string()),
});

const permissionsResponse = z.object({ permissions: z.array(permissionSchema) });
const rolesResponse = z.object({ roles: z.array(roleSchema) });
const roleResponse = z.object({ role: roleSchema });

export type Permission = z.infer<typeof permissionSchema>;
export type Role = z.infer<typeof roleSchema>;

export async function getPermissions(): Promise<Permission[]> {
  const response = await api.get("admin/permissions");
  return permissionsResponse.parse(await response.json()).permissions;
}

export async function getRoles(): Promise<Role[]> {
  const response = await api.get("admin/roles");
  return rolesResponse.parse(await response.json()).roles;
}

export interface CreateRoleInput {
  key: string;
  name: string;
  description: string;
  scope: "workspace" | "platform";
  permissions: string[];
}

export async function createRole(input: CreateRoleInput): Promise<Role> {
  const response = await api.post("admin/roles", { json: input });
  return roleResponse.parse(await response.json()).role;
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  permissions?: string[];
}

export async function updateRole(roleId: string, input: UpdateRoleInput): Promise<Role> {
  const response = await api.patch(`admin/roles/${roleId}`, { json: input });
  return roleResponse.parse(await response.json()).role;
}

export async function deleteRole(roleId: string): Promise<void> {
  await api.delete(`admin/roles/${roleId}`);
}

/** Groups permissions by resource, in catalogue order, for the matrix. */
export function groupByResource(permissions: Permission[]): [string, Permission[]][] {
  const groups = new Map<string, Permission[]>();
  for (const permission of permissions) {
    const bucket = groups.get(permission.resource);
    if (bucket) bucket.push(permission);
    else groups.set(permission.resource, [permission]);
  }
  return [...groups.entries()];
}
