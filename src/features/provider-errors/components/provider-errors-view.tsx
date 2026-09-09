"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { DetailShell } from "@/components/detail-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useProviderErrorsSuspense } from "../hooks/provider-errors.hook";
import { explainStatus } from "../service/provider-errors.service";

const RANGES = [1, 7, 30] as const;

/**
 * Provider calls that failed.
 *
 * The screen answers "why did that stop working on Tuesday", which is the
 * question this table exists for. It leads with the **summary** rather than the
 * newest rows, because one provider failing four hundred times is one incident
 * and four hundred lines of it hides everything else that happened that day.
 *
 * An empty screen is the healthy state, and it says so — only failures are
 * recorded, so nothing here means nothing failed.
 */
export function ProviderErrorsView() {
  const [days, setDays] = useState<number>(7);
  const { data } = useProviderErrorsSuspense({ days });

  const total = data.summary.reduce((sum, row) => sum + row.failures, 0);

  return (
    <DetailShell>
      <PageHeader
        title="Provider errors"
        description="Calls to a model provider that failed — refused, rate limited, timed out."
        info="Only failures are recorded. A successful call is already in the usage ledger, and a row per call would grow with traffic instead of with what is wrong."
        actions={
          <div className="flex rounded-md border p-0.5">
            {RANGES.map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setDays(range)}
                className={cn(
                  "rounded-sm px-3 py-1 text-sm transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
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

      {total === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 rounded-lg border border-dashed p-10 text-center">
          <CheckCircle2 className="size-8 text-success" />
          <p className="font-medium">No provider call failed in this range</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Which is what an empty screen means here — nothing is written unless a
            call failed.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          <section>
            <h2 className="text-sm font-semibold">What is failing</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatNumber(total)} failed{" "}
              {total === 1 ? "call" : "calls"} in the last {days}{" "}
              {days === 1 ? "day" : "days"}, grouped by what went wrong.
            </p>

            <div className="mt-3 overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Operation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Failures</TableHead>
                    <TableHead>Most recent</TableHead>
                    <TableHead>What it usually means</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.summary.map((row) => (
                    <TableRow key={`${row.provider}-${row.operation}-${row.status}`}>
                      <TableCell className="font-medium">{row.provider}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.operation}
                      </TableCell>
                      <TableCell>
                        <StatusCode status={row.status} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(row.failures)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDateTime(row.lastAt)}
                      </TableCell>
                      <TableCell className="max-w-xs text-xs text-muted-foreground">
                        {explainStatus(row.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold">The most recent, in full</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The provider&apos;s own message, capped. Newest first, up to 200.
            </p>

            <div className="mt-3 overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Operation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Took</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.errors.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDateTime(row.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium">{row.provider}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {row.model ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.operation}
                      </TableCell>
                      <TableCell>
                        <StatusCode status={row.status} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {row.durationMs === null ? "—" : `${formatNumber(row.durationMs)}ms`}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <span className="line-clamp-2 text-xs text-muted-foreground">
                          {row.message}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        </div>
      )}
    </DetailShell>
  );
}

/** A timeout has no status, and "—" is more honest than pretending it was a 0. */
function StatusCode({ status }: { status: number | null }) {
  if (status === null) return <StatusBadge tone="neutral">no response</StatusBadge>;
  return (
    <StatusBadge tone={status >= 500 ? "warning" : "danger"}>{status}</StatusBadge>
  );
}

export function ProviderErrorsLoading() {
  return (
    <DetailShell>
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner />
          Loading provider errors...
        </p>
      </div>
    </DetailShell>
  );
}

export function ProviderErrorsError() {
  return (
    <DetailShell>
      <div className="flex flex-col items-center gap-2 rounded-md border p-10 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <p className="font-medium">Could not load provider errors</p>
        <p className="max-w-md text-sm text-muted-foreground">
          The platform admin API refused or is unreachable. This screen needs the{" "}
          <code className="font-mono text-xs">admin.errors.read</code> permission.
        </p>
      </div>
    </DetailShell>
  );
}
