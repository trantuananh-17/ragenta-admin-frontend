"use client";

import Link from "next/link";
import { useState } from "react";
import { CoinsIcon, CreditCardIcon, ScrollTextIcon } from "lucide-react";

import { CopyButton } from "@/components/copy-button";
import { DetailList, DetailSection, DetailShell } from "@/components/detail-shell";
import { PageHeader } from "@/components/page-header";
import { StatCard, StatCardGrid } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { useWorkspaceSuspense } from "@/features/workspaces/hooks/workspaces.hook";
import { formatCredits, formatDateTime, formatUsd } from "@/lib/format";
import { AdjustCreditsDialog } from "./adjust-credits-dialog";
import { ChangePlanDialog } from "./change-plan-dialog";
import { PlanBadge } from "./plan-badge";

export function WorkspaceDetail({ workspaceId }: { workspaceId: string }) {
  const { data } = useWorkspaceSuspense(workspaceId);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);

  const { workspace, billing, members } = data;
  const { price } = billing.limits;

  return (
    <DetailShell>
      <PageHeader
        back={{ href: "/admin/workspaces", label: "Workspaces" }}
        title={workspace.name}
        description={
          <span className="flex items-center gap-1">
            <span className="font-mono text-xs">{workspace.id}</span>
            <CopyButton value={workspace.id} />
          </span>
        }
        badges={<PlanBadge plan={billing.plan} />}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/audit-log?workspaceId=${workspace.id}`}>
                <ScrollTextIcon className="size-4" />
                Audit log
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPlanOpen(true)}>
              <CreditCardIcon className="size-4" />
              Change plan
            </Button>
            <Button size="sm" onClick={() => setAdjustOpen(true)}>
              <CoinsIcon className="size-4" />
              Adjust credits
            </Button>
          </>
        }
      />

      <StatCardGrid>
        <StatCard
          label="Total credits"
          value={formatCredits(billing.credits.total)}
          hint="Plan bucket is spent before the top-up bucket."
        />
        <StatCard label="Plan credits" value={formatCredits(billing.credits.plan)} />
        <StatCard
          label="Top-up credits"
          value={formatCredits(billing.credits.topup)}
          hint="Never expires."
        />
        <StatCard
          label="Seats"
          value={
            billing.seats.limit === null
              ? `${billing.seats.used} / ∞`
              : `${billing.seats.used} / ${billing.seats.limit}`
          }
          hint="Members plus pending invitations."
        />
      </StatCardGrid>

      <DetailSection title="Workspace">
        <DetailList
          items={[
            { label: "Name", value: workspace.name },
            {
              label: "Slug",
              value: <span className="font-mono text-xs">{workspace.slug}</span>,
            },
            { label: "Members", value: members },
            { label: "Created", value: formatDateTime(workspace.createdAt) },
          ]}
        />
      </DetailSection>

      <DetailSection
        title="Plan and entitlements"
        description="Served from the same constants the backend enforces, so a number here is the number the seat cap and the refill job actually use."
      >
        <DetailList
          items={[
            { label: "Plan", value: billing.plan },
            {
              label: "Price",
              value:
                price.monthlyUsd !== null
                  ? `${formatUsd(price.monthlyUsd)} / month`
                  : price.perSeatUsd !== null
                    ? `${formatUsd(price.perSeatUsd)} / seat / month`
                    : "Invoiced by hand",
            },
            {
              label: "Seat limit",
              value: billing.limits.seatLimit ?? "Unlimited",
            },
            {
              label: "Credits per refill",
              value:
                billing.limits.flatCredits !== null
                  ? `${formatCredits(billing.limits.flatCredits)} flat`
                  : billing.limits.creditsPerSeat !== null
                    ? `${formatCredits(billing.limits.creditsPerSeat)} per seat`
                    : "One-time grant only",
            },
            {
              label: "Next plan reset",
              value: formatDateTime(billing.credits.resetAt),
            },
            {
              label: "Top-ups",
              value: billing.limits.topupsEnabled ? "Allowed" : "Not on this plan",
            },
            {
              label: "Model tiers",
              value: billing.limits.modelTiers.join(", "),
            },
          ]}
        />
      </DetailSection>

      <AdjustCreditsDialog
        workspaceId={workspace.id}
        workspaceName={workspace.name}
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
      />
      <ChangePlanDialog
        workspaceId={workspace.id}
        workspaceName={workspace.name}
        currentPlan={billing.plan}
        open={planOpen}
        onOpenChange={setPlanOpen}
      />
    </DetailShell>
  );
}
