import { z } from "zod";

import { api } from "@/lib/ky";
import { pageSchema, toOffset } from "@/lib/pagination";
import type { UsersParams } from "../params";

/**
 * `GET /v1/admin/users` — a cross-tenant read, which is why it sits behind the
 * backend's platform-admin gate. Everything here is validated: a shape drift in
 * the backend should fail loudly at this boundary, not three components later.
 */
export const adminUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  /** Better Auth stores a comma-separated list, not a single value. */
  role: z.string().nullable(),
  banned: z.boolean().nullable(),
  createdAt: z.coerce.string(),
});

export const usersPageSchema = pageSchema(adminUserSchema);

export type AdminUser = z.infer<typeof adminUserSchema>;
export type UsersPage = z.infer<typeof usersPageSchema>;

export async function getUsers(params: UsersParams): Promise<UsersPage> {
  const searchParams: Record<string, string | number> = {
    limit: params.limit,
    offset: toOffset(params.page, params.limit),
  };
  if (params.search) searchParams.search = params.search;

  const response = await api.get("admin/users", { searchParams });
  return usersPageSchema.parse(await response.json());
}

export function roleList(role: string | null): string[] {
  return (role ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function isPlatformAdmin(user: AdminUser): boolean {
  return roleList(user.role).includes("admin");
}
