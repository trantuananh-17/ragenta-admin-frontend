import { getAuditLog } from "@/features/audit-log/service/audit-log.service";
import { getUsers } from "@/features/users/service/users.service";
import { getWorkspaces } from "@/features/workspaces/service/workspaces.service";

/**
 * There is no aggregate endpoint on the backend, so the dashboard composes the
 * three admin lists it already has. That has one consequence worth stating out
 * loud rather than hiding: the plan mix and the credit totals are computed over
 * the newest `WORKSPACE_SAMPLE` workspaces, not the whole table.
 *
 * When it stops being a fair picture, the fix is a real `GET /v1/admin/overview`
 * in `ragenta-backend` — not a bigger page size here.
 */
export const WORKSPACE_SAMPLE = 100;

export interface DashboardOverview {
  totalUsers: number;
  totalWorkspaces: number;
  sampleSize: number;
  /** True once the sample stops covering every workspace. */
  sampled: boolean;
  planMix: { plan: string; workspaces: number }[];
  creditsInSample: { plan: number; topup: number; total: number };
  recentActivity: Awaited<ReturnType<typeof getAuditLog>>["items"];
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const [users, workspaces, audit] = await Promise.all([
    // One row is enough — only the total is used.
    getUsers({ page: 1, limit: 1, search: "" }),
    getWorkspaces({ page: 1, limit: WORKSPACE_SAMPLE, search: "" }),
    getAuditLog({
      page: 1,
      limit: 8,
      workspaceId: "",
      actorId: "",
      action: "",
    }),
  ]);

  const counts = new Map<string, number>();
  let planCredits = 0;
  let topupCredits = 0;

  for (const workspace of workspaces.items) {
    const plan = workspace.plan ?? "no plan";
    counts.set(plan, (counts.get(plan) ?? 0) + 1);
    planCredits += workspace.planCredits ?? 0;
    topupCredits += workspace.topupCredits ?? 0;
  }

  return {
    totalUsers: users.total,
    totalWorkspaces: workspaces.total,
    sampleSize: workspaces.items.length,
    sampled: workspaces.total > workspaces.items.length,
    planMix: [...counts.entries()]
      .map(([plan, count]) => ({ plan, workspaces: count }))
      .sort((a, b) => b.workspaces - a.workspaces),
    creditsInSample: {
      plan: planCredits,
      topup: topupCredits,
      total: planCredits + topupCredits,
    },
    recentActivity: audit.items,
  };
}
