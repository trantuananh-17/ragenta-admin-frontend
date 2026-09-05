"use client";

import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { DetailSection, DetailShell } from "@/components/detail-shell";
import { EntityStateView } from "@/components/entity-components";
import { PageHeader } from "@/components/page-header";
import { StatCard, StatCardGrid } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
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

  return (
    <DetailShell>
      <PageHeader
        title="Dashboard"
        description="Where the platform stands right now."
      />

      <StatCardGrid>
        <StatCard label="Accounts" value={formatNumber(data.totalUsers)} />
        <StatCard label="Workspaces" value={formatNumber(data.totalWorkspaces)} />
        <StatCard
          label="Credits outstanding"
          value={formatCredits(data.creditsInSample.total)}
          hint={sampleNote}
        />
        <StatCard
          label="Top-up credits"
          value={formatCredits(data.creditsInSample.topup)}
          hint="Purchased, never expires."
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
          <ChartContainer config={chartConfig} className="h-[240px] w-full">
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
                className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-mono text-xs">{entry.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.organizationId ? (
                      <Link
                        href={`/admin/workspaces/${entry.organizationId}`}
                        className="hover:underline"
                      >
                        {entry.organizationId.slice(0, 16)}…
                      </Link>
                    ) : (
                      "no workspace"
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge
                    tone={entry.status === "success" ? "success" : "danger"}
                  >
                    {entry.status}
                  </StatusBadge>
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatDateTime(entry.createdAt)}
                  </span>
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
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
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
