import { StatusBadge } from "@/components/status-badge";

export const PLAN_NAMES = ["free", "pro", "team", "enterprise"] as const;
export type PlanName = (typeof PLAN_NAMES)[number];

/** Statuses that entitle a workspace to its plan — mirrors the backend's list. */
const ACTIVE_STATUSES = ["active", "trialing"];

export function PlanBadge({ plan }: { plan: string | null }) {
  if (!plan) return <StatusBadge>no plan</StatusBadge>;
  return (
    <StatusBadge tone={plan === "free" ? "neutral" : "info"}>{plan}</StatusBadge>
  );
}

export function SubscriptionStatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-xs text-muted-foreground">—</span>;
  if (ACTIVE_STATUSES.includes(status)) {
    return <StatusBadge tone="success">{status}</StatusBadge>;
  }
  if (status === "past_due" || status === "canceled") {
    return <StatusBadge tone="danger">{status}</StatusBadge>;
  }
  return <StatusBadge tone="warning">{status}</StatusBadge>;
}
