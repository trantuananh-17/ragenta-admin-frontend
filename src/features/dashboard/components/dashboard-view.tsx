"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { DetailSection, DetailShell } from "@/components/detail-shell";
import { EntityStateView } from "@/components/entity-components";
import { PageHeader } from "@/components/page-header";
import { StatCard, StatCardGrid } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useDashboardSuspense } from "@/features/dashboard/hooks/dashboard.hook";
import { WORKSPACE_SAMPLE } from "@/features/dashboard/service/dashboard.service";
import { formatCredits, formatDateTime, formatNumber } from "@/lib/format";

const chartConfig = {
  workspaces: { label: "Workspaces", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function DashboardView() {
  const { data } = useDashboardSuspense();

  const sampleNote = data.sampled
    ? `Across the newest ${formatNumber(data.sampleSize)} of ${formatNumber(data.totalWorkspaces)} workspaces.`
    : "Across every workspace.";

  // The counts on their own say nothing about whether the platform is healthy.
  // These two relate each figure to another one already on screen, which is the
  // most the overview endpoint can support — it returns no earlier period, so
  // there is no honest trend to draw.
  const accountsPerWorkspace =
    data.totalWorkspaces > 0
      ? `${(data.totalUsers / data.totalWorkspaces).toFixed(1)} per workspace.`
      : undefined;

  const topupShare =
    data.creditsInSample.total > 0
      ? `${Math.round((data.creditsInSample.topup / data.creditsInSample.total) * 100)}% of the balance. Purchased, never expires.`
      : "Purchased, never expires.";

  return (
    <DetailShell>
      <PageHeader
        title="Dashboard"
        description="Where the platform stands right now."
      />

      <StatCardGrid>
        <StatCard
          label="Accounts"
          value={formatNumber(data.totalUsers)}
          hint={accountsPerWorkspace}
        />
        <StatCard
          label="Workspaces"
          value={formatNumber(data.totalWorkspaces)}
          hint={
            data.planMix.length > 0
              ? `${data.planMix.length} ${data.planMix.length === 1 ? "plan" : "plans"} in use.`
              : undefined
          }
        />
        <StatCard
          label="Credits outstanding"
          value={formatCredits(data.creditsInSample.total)}
          hint={sampleNote}
        />
        <StatCard
          label="Top-up credits"
          value={formatCredits(data.creditsInSample.topup)}
          hint={topupShare}
        />
      </StatCardGrid>

      <DetailSection
        title="Plan mix"
        description={sampleNote}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/workspaces">All workspaces</Link>
          </Button>
        }
      >
        {data.planMix.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No workspaces exist on this environment yet.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-60 w-full">
            <BarChart data={data.planMix} layout="vertical" margin={{ left: 12 }}>
              <CartesianGrid horizontal={false} />
              <XAxis type="number" allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="plan"
                width={90}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="workspaces" fill="var(--color-workspaces)" radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </DetailSection>

      <DetailSection
        title="Recent activity"
        description="The newest entries in the audit log."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/audit-log">Full log</Link>
          </Button>
        }
      >
        {data.recentActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing recorded yet.</p>
        ) : (
          <ul className="divide-y">
            {data.recentActivity.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 items-center gap-2">
                  {/* The badge leads: on a log, "did it work" is read before
                      "what was it", and only failures need a second look. */}
                  <StatusBadge
                    tone={entry.status === "success" ? "success" : "danger"}
                  >
                    {entry.status}
                  </StatusBadge>
                  <span className="truncate font-mono text-sm">
                    {entry.action}
                  </span>
                </div>
                <div className="flex min-w-0 items-center gap-3 text-xs text-muted-foreground">
                  {entry.organizationId ? (
                    <Link
                      href={`/admin/workspaces/${entry.organizationId}`}
                      className="truncate rounded-sm font-mono hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      {entry.organizationId.slice(0, 16)}…
                    </Link>
                  ) : (
                    <span>no workspace</span>
                  )}
                  <time dateTime={new Date(entry.createdAt).toISOString()}>
                    {formatDateTime(entry.createdAt)}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <p className="text-xs text-muted-foreground">
        The totals above are composed from the admin list endpoints — the backend
        has no aggregate route yet, so anything derived from the workspace list is
        computed over at most {WORKSPACE_SAMPLE} rows.
      </p>
    </DetailShell>
  );
}

export function DashboardLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner className="size-8 text-muted-foreground" />
    </div>
  );
}

export function DashboardError() {
  return (
    <EntityStateView
      icon={<AlertCircle className="size-8 text-destructive" />}
      title="Could not load the dashboard"
      message="One of the admin endpoints refused or is unreachable."
    />
  );
}
