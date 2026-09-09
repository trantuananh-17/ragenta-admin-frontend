"use client";

import { useState } from "react";
import { AlertCircle, Coins, Loader2, Scale, TrendingUp, Wallet } from "lucide-react";

import { DetailShell } from "@/components/detail-shell";
import { PageHeader } from "@/components/page-header";
import { StatCard, StatCardGrid } from "@/components/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useRevenueSuspense } from "../hooks/revenue.hook";
import type { Revenue } from "../service/revenue.service";

const RANGES = [7, 30, 90] as const;

const money = new Intl.NumberFormat("en", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

/**
 * Small amounts keep their precision. A month of provider cost on a quiet
 * deployment is measured in cents, and a margin printed as "$0.00" is worse than
 * no number at all.
 */
function usd(value: number): string {
  if (value === 0) return "$0";
  if (Math.abs(value) < 0.01) return `$${value.toFixed(4)}`;
  return money.format(value);
}

/**
 * What the deployment earns against what it costs.
 *
 * The distinction the whole screen is built around: **run rate is a snapshot,
 * collected is a range.** Today's subscriptions bill a certain amount per month
 * whatever window you are looking at; top-ups were bought on particular days.
 * Adding the two would produce a number that means nothing, so they sit in
 * separate cards and only the second is used for the margin.
 */
export function RevenueView() {
  const [days, setDays] = useState<number>(30);
  const { data } = useRevenueSuspense({ days });

  const marginPositive = data.margin.usd >= 0;

  return (
    <DetailShell>
      <PageHeader
        title="Revenue"
        description="What workspaces pay us, what the providers charge us, and the gap."
        info="Run rate is what today's active subscriptions bill in a month and does not move with the range. Collected is money that changed hands inside it — top-up packs, the only payment this database records. The margin compares provider cost against collected, never against the run rate."
        actions={
          <div className="flex rounded-md border p-0.5">
            {RANGES.map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setDays(range)}
                className={cn(
                  "rounded px-3 py-1 text-sm transition-colors",
                  range === days
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {range}d
              </button>
            ))}
          </div>
        }
      />

      <div className="mt-6 space-y-6">
        <StatCardGrid>
          <StatCard
            label="Monthly run rate"
            value={usd(data.runRate.mrrUsd)}
            hint={`${data.runRate.workspaces} active subscriptions — does not move with the range`}
            icon={<TrendingUp className="size-4" />}
          />
          <StatCard
            label="Collected in range"
            value={usd(data.collected.usd)}
            hint={`${data.collected.purchases} top-up purchases`}
            icon={<Coins className="size-4" />}
          />
          <StatCard
            label="Provider cost"
            value={usd(data.cost.usd)}
            hint={`${data.cost.calls} calls, each priced when it was made`}
            icon={<Wallet className="size-4" />}
          />
          <StatCard
            label="Margin"
            value={usd(data.margin.usd)}
            hint={
              data.margin.ratio === null
                ? "Nothing was collected in this range"
                : `${(data.margin.ratio * 100).toFixed(1)}% of collected`
            }
            icon={
              <Scale className={cn("size-4", marginPositive ? undefined : "text-destructive")} />
            }
          />
        </StatCardGrid>

        <Caveats revenue={data} />

        <DailyCost rows={data.daily} />

        <section className="rounded-lg border bg-background">
          <header className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Run rate by plan</h2>
            <p className="text-xs text-muted-foreground">
              Active subscriptions at the list price in{" "}
              <code className="font-mono">plans.ts</code> — the same table the seat cap reads.
            </p>
          </header>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Workspaces</TableHead>
                  <TableHead className="text-right">Seats</TableHead>
                  <TableHead className="text-right">Per month</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.runRate.byPlan.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      No workspace holds an active subscription.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.runRate.byPlan.map((row) => (
                    <TableRow key={row.plan}>
                      <TableCell className="font-mono text-xs">{row.plan}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.workspaces}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.seats}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {row.usd === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          usd(row.usd)
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="rounded-lg border bg-background">
          <header className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Provider cost by workspace</h2>
            <p className="text-xs text-muted-foreground">
              The 25 most expensive in this range. Cost is what we paid; credits are what they were
              charged.
            </p>
          </header>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workspace</TableHead>
                  <TableHead className="text-right">Calls</TableHead>
                  <TableHead className="text-right">Credits charged</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.costByWorkspace.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      Nothing was spent in this range.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.costByWorkspace.map((row) => (
                    <TableRow key={row.workspaceId}>
                      <TableCell className="max-w-64 truncate">{row.name}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.calls}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {Math.round(Number(row.credits)).toLocaleString("en")}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {usd(Number(row.usd))}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </DetailShell>
  );
}

/**
 * The things that would otherwise let a reader trust a number more than they
 * should. Rendered only when they apply, so the screen stays quiet when nothing
 * needs qualifying.
 */
function Caveats({ revenue }: { revenue: Revenue }) {
  const notes: string[] = [];

  if (revenue.runRate.unpricedWorkspaces > 0) {
    notes.push(
      `${revenue.runRate.unpricedWorkspaces} workspace(s) sit on a plan with no list price. Enterprise is invoiced by hand, so they contribute nothing to the run rate above.`,
    );
  }

  if (revenue.collected.unpricedCredits > 0) {
    notes.push(
      `${Math.round(revenue.collected.unpricedCredits).toLocaleString("en")} credits arrived as a top-up matching no pack we sell. They are counted as no revenue rather than guessed at.`,
    );
  }

  if (revenue.collected.usd === 0 && revenue.cost.usd > 0) {
    notes.push(
      "Nothing was collected in this range, so the margin is simply the provider bill and the percentage is not a ratio.",
    );
  }

  if (notes.length === 0) return null;

  return (
    <ul className="space-y-1 rounded-lg border bg-muted/40 p-4 text-xs text-muted-foreground">
      {notes.map((note) => (
        <li key={note}>{note}</li>
      ))}
    </ul>
  );
}

function DailyCost({ rows }: { rows: Revenue["daily"] }) {
  if (rows.length === 0) return null;

  const peak = Math.max(...rows.map((row) => Number(row.usd)), 0.000001);

  return (
    <section className="rounded-lg border bg-background p-4">
      <h2 className="text-sm font-semibold">Provider cost per day</h2>
      <div className="mt-4 flex h-32 items-end gap-1">
        {rows.map((row) => (
          <div
            key={row.day}
            className="group relative flex-1 rounded-t bg-primary/70 transition-colors hover:bg-primary"
            style={{ height: `${Math.max((Number(row.usd) / peak) * 100, 2)}%` }}
            title={`${row.day} — ${usd(Number(row.usd))}`}
          >
            <span className="sr-only">
              {row.day}: {usd(Number(row.usd))}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{rows[0]?.day}</span>
        <span>{rows[rows.length - 1]?.day}</span>
      </div>
    </section>
  );
}

export function RevenueLoading() {
  return (
    <DetailShell>
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Working out what came in and what went out...
        </p>
      </div>
    </DetailShell>
  );
}

export function RevenueError() {
  return (
    <DetailShell>
      <div className="flex flex-col items-center gap-2 rounded-md border p-10 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <p className="font-medium">Could not load revenue</p>
        <p className="max-w-md text-sm text-muted-foreground">
          The platform admin API refused or is unreachable. This screen needs the{" "}
          <code className="font-mono text-xs">admin.usage.read</code> permission, which the support
          role deliberately does not hold.
        </p>
      </div>
    </DetailShell>
  );
}
