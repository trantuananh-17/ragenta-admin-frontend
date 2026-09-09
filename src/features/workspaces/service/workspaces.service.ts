import { z } from "zod";

import { api } from "@/lib/ky";
import { pageSchema, toOffset } from "@/lib/pagination";
import {
  assignedRolesResponse,
  type AssignedRole,
} from "@/features/roles/service/roles.service";
import type { WorkspacesParams } from "../params";

/**
 * A workspace is Better Auth's organization — the tenant everything else hangs
 * off. `plan` and the two credit buckets come from the left joins the backend's
 * admin repository does, so a workspace with no subscription row yet answers
 * null rather than being absent from the list.
 *
 * Credits are `numeric` in Postgres and arrive as strings; they are coerced here
 * so nothing downstream has to remember that.
 */
export const adminWorkspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.coerce.string(),
  plan: z.string().nullable(),
  subscriptionStatus: z.string().nullable(),
  planCredits: z.coerce.number().nullable(),
  topupCredits: z.coerce.number().nullable(),
});

export const workspacesPageSchema = pageSchema(adminWorkspaceSchema);

const planPriceSchema = z.object({
  monthlyUsd: z.number().nullable(),
  perSeatUsd: z.number().nullable(),
  includedSeats: z.number().nullable(),
  extraSeatUsd: z.number().nullable(),
});

export const planLimitsSchema = z.object({
  seatLimit: z.number().nullable(),
  creditsPerSeat: z.number().nullable(),
  flatCredits: z.number().nullable(),
  topupsEnabled: z.boolean(),
  modelTiers: z.array(z.string()),
  /**
   * What the plan unlocks beyond credits. Defaulted so an older backend does not
   * fail the catalogue — and defaulted to *ungated*, because an API that does not
   * send these fields is one that does not enforce them, so "unlimited" and
   * "included" describe what it actually does.
   */
  widgetLimit: z.number().nullable().default(null),
  knowledgeBaseLimit: z.number().nullable().default(null),
  agentLimit: z.number().nullable().default(null),
  apiKeysEnabled: z.boolean().default(true),
  dataSourcesEnabled: z.boolean().default(true),
  automationEnabled: z.boolean().default(true),
  price: planPriceSchema,
  stripePriceKey: z.string().nullable(),
});

export const billingSummarySchema = z.object({
  plan: z.string(),
  limits: planLimitsSchema,
  credits: z.object({
    plan: z.number(),
    topup: z.number(),
    total: z.number(),
    resetAt: z.coerce.string().nullable(),
  }),
  seats: z.object({
    used: z.number(),
    limit: z.number().nullable(),
  }),
});

export const workspaceDetailSchema = z.object({
  workspace: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    logo: z.string().nullable(),
    metadata: z.string().nullable(),
    createdAt: z.coerce.string(),
  }),
  billing: billingSummarySchema,
  members: z.number(),
});

export type AdminWorkspace = z.infer<typeof adminWorkspaceSchema>;
export type WorkspacesPage = z.infer<typeof workspacesPageSchema>;
export type WorkspaceDetail = z.infer<typeof workspaceDetailSchema>;
export type BillingSummary = z.infer<typeof billingSummarySchema>;

export async function getWorkspaces(
  params: WorkspacesParams,
): Promise<WorkspacesPage> {
  const searchParams: Record<string, string | number> = {
    limit: params.limit,
    offset: toOffset(params.page, params.limit),
  };
  if (params.search) searchParams.search = params.search;

  const response = await api.get("admin/workspaces", { searchParams });
  return workspacesPageSchema.parse(await response.json());
}

export async function getWorkspace(
  workspaceId: string,
): Promise<WorkspaceDetail> {
  const response = await api.get(`admin/workspaces/${workspaceId}`);
  return workspaceDetailSchema.parse(await response.json());
}

export interface AdjustCreditsInput {
  /** Positive grants, negative claws back. Never zero — the backend rejects it. */
  amount: number;
  bucket: "plan" | "topup";
  reason: string;
  /**
   * Makes the adjustment safe to retry: the backend turns it into the ledger's
   * `(kind, reference)` uniqueness, so a resubmitted form is a no-op rather than
   * a second movement of credit.
   */
  idempotencyKey: string;
}

export async function adjustCredits(
  workspaceId: string,
  input: AdjustCreditsInput,
): Promise<void> {
  await api.post(`admin/workspaces/${workspaceId}/credits`, { json: input });
}

/**
 * A membership, not an account. Workspace roles hang off `member.id`, so the same
 * person in two workspaces is two rows here with two independent role sets.
 */
export const workspaceMemberSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  email: z.string(),
  /** Better Auth's own column; the built-in role Ragenta grants follows it. */
  role: z.string(),
  createdAt: z.coerce.string(),
});

const membersResponse = z.object({ members: z.array(workspaceMemberSchema) });

export type WorkspaceMember = z.infer<typeof workspaceMemberSchema>;

export async function getWorkspaceMembers(
  workspaceId: string,
): Promise<WorkspaceMember[]> {
  const response = await api.get(`admin/workspaces/${workspaceId}/members`);
  return membersResponse.parse(await response.json()).members;
}

export async function getMemberRoles(
  workspaceId: string,
  memberId: string,
): Promise<AssignedRole[]> {
  const response = await api.get(
    `admin/workspaces/${workspaceId}/members/${memberId}/roles`,
  );
  return assignedRolesResponse.parse(await response.json()).roles;
}

/**
 * The set replaces what the membership holds, and it must still contain the
 * member's current built-in role — the backend refuses otherwise, because that
 * one follows Better Auth's `member.role` and this endpoint is not its writer.
 */
export async function setMemberRoles(
  workspaceId: string,
  memberId: string,
  roleIds: string[],
): Promise<AssignedRole[]> {
  const response = await api.put(
    `admin/workspaces/${workspaceId}/members/${memberId}/roles`,
    { json: { roleIds } },
  );
  return assignedRolesResponse.parse(await response.json()).roles;
}

export async function setWorkspacePlan(
  workspaceId: string,
  plan: string,
): Promise<void> {
  await api.put(`admin/workspaces/${workspaceId}/plan`, { json: { plan } });
}
