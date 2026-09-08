"use client";

import { useState } from "react";
import { AlertCircle, Boxes, Building2, Coins, Cpu, Loader2 } from "lucide-react";

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
import { usePlatformUsageSuspense } from "../hooks/platform-usage.hook";
import {
  formatCount,
  formatCredits,
  totalTokens,
  type DailyUsage,
} from "../service/platform-usage.service";

const RANGES = [7, 30, 90] as const;

/**
 * What the platform has spent, and on what.
 *
 * The distinction this screen exists to keep visible: **tokens are what the
 * provider counted, credits are what the customer was charged.** They are
 * different numbers with the margin between them, so they get their own columns
 * and are never added together.
 */
export function PlatformUsageView() {
  const [days, setDays] = useState<number>(30);
  const { data } = usePlatformUsageSuspense({ days });

  const totals = data.totals;

  return (
    <>
      <PageHeader
        title="Usage"
        description="Every provider call this deployment has billed, across every workspace."
        info="Tokens are what the provider counted. Credits are what the workspace was charged, priced when the call was made — a later price change never restates them."
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
            label="Credits charged"
            value={totals ? formatCredits(totals.credits) : "0"}
            hint="What workspaces were billed"
            icon={<Coins className="size-4" />}
          />
          <StatCard
            label="Tokens"
            value={totals ? formatCount(totalTokens(totals)) : "0"}
            hint="What the providers counted"
            icon={<Cpu className="size-4" />}
          />
          <StatCard
            label="Models used"
            value={totals?.models ?? 0}
            hint={`${totals?.calls ?? 0} provider calls`}
            icon={<Boxes className="size-4" />}
          />
          <StatCard
            label="Workspaces"
            value={totals?.workspaces ?? 0}
            hint="That spent anything in this range"
            icon={<Building2 className="size-4" />}
          />
        </StatCardGrid>

        <DailyTrend rows={data.daily} />

        <section className="rounded-lg border bg-background">
          <header className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">By model</h2>
            <p className="text-xs text-muted-foreground">
              Ordered by credits charged. A model priced from an import carries the vendor&apos;s own
              rate.
            </p>
          </header>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Calls</TableHead>
                  <TableHead className="text-right">In</TableHead>
                  <TableHead className="text-right">Out</TableHead>
                  <TableHead className="text-right">Embedding</TableHead>
                  <TableHead className="text-right">Credits</TableHead>
                  <TableHead className="text-right">Workspaces</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.models.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                      Nothing was billed in this range.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.models.map((row) => (
                    <TableRow key={`${row.provider}/${row.model}`}>
                      <TableCell className="font-mono text-xs">
                        <span className="text-muted-foreground">{row.provider}/</span>
                        {row.model}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCount(String(row.calls), "full")}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCount(row.inputTokens)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCount(row.outputTokens)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCount(row.embeddingTokens)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCredits(row.credits)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{row.workspaces}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-lg border bg-background">
            <header className="border-b px-4 py-3">
              <h2 className="text-sm font-semibold">By operation</h2>
              <p className="text-xs text-muted-foreground">
                Where the spend comes from: chat, ingestion, agents, speech.
              </p>
            </header>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Operation</TableHead>
                    <TableHead className="text-right">Calls</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead className="text-right">Credits</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.operations.map((row) => (
                    <TableRow key={row.operation}>
                      <TableCell className="font-mono text-xs">{row.operation}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCount(String(row.calls), "full")}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCount(totalTokens(row))}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCredits(row.credits)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="rounded-lg border bg-background">
            <header className="border-b px-4 py-3">
              <h2 className="text-sm font-semibold">By workspace</h2>
              <p className="text-xs text-muted-foreground">
                The 25 that spent most. A workspace deleted since is still named.
              </p>
            </header>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workspace</TableHead>
                    <TableHead className="text-right">Calls</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead className="text-right">Credits</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.workspaces.map((row) => (
                    <TableRow key={row.workspaceId}>
                      <TableCell className="max-w-48 truncate">{row.name}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCount(String(row.calls), "full")}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCount(totalTokens(row))}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCredits(row.credits)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

/**
 * Credits per day as bars.
 *
 * Deliberately not a charting library: one series of at most ninety values needs
 * a `div` with a height, and the alternative is a dependency whose bundle is
 * larger than this whole screen.
 */
function DailyTrend({ rows }: { rows: DailyUsage[] }) {
  if (rows.length === 0) return null;

  const peak = Math.max(...rows.map((row) => Number(row.credits)), 1);

  return (
    <section className="rounded-lg border bg-background p-4">
      <h2 className="text-sm font-semibold">Credits per day</h2>
      <div className="mt-4 flex h-32 items-end gap-1">
        {rows.map((row) => {
          const value = Number(row.credits);
          return (
            <div
              key={row.day}
              className="group relative flex-1 rounded-t bg-primary/70 transition-colors hover:bg-primary"
              style={{ height: `${Math.max((value / peak) * 100, 2)}%` }}
              title={`${row.day} — ${formatCredits(row.credits)} credits, ${row.calls} calls`}
            >
              <span className="sr-only">
                {row.day}: {formatCredits(row.credits)} credits
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{rows[0]?.day}</span>
        <span>{rows[rows.length - 1]?.day}</span>
      </div>
    </section>
  );
}

export function PlatformUsageLoading() {
  return (
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
        Adding up what has been spent...
      </p>
    </div>
  );
}

export function PlatformUsageError() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md border p-10 text-center">
      <AlertCircle className="size-8 text-destructive" />
      <p className="font-medium">Could not load usage</p>
      <p className="max-w-md text-sm text-muted-foreground">
        The platform admin API refused or is unreachable. This screen needs the{" "}
        <code className="font-mono text-xs">admin.usage.read</code> permission, which the support
        role deliberately does not hold.
      </p>
    </div>
  );
}
