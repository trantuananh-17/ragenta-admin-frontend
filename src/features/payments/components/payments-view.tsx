"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, ExternalLink, Loader2 } from "lucide-react";

import { DetailShell } from "@/components/detail-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { usePaymentsSuspense } from "../hooks/payments.hook";

const PAGE_SIZE = 50;

const STATUSES = [
  { value: "", label: "All" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
] as const;

const money = new Intl.NumberFormat("en", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function tone(status: string) {
  if (status === "paid") return "success" as const;
  if (status === "failed") return "danger" as const;
  return "neutral" as const;
}

/**
 * Every payment, across every workspace.
 *
 * Beside the revenue report rather than inside it: that one answers "are we
 * making money", this one answers "did this customer's charge go through", and
 * the second is asked about one workspace at a moment of confusion rather than
 * about the platform at the end of a month.
 *
 * Failures are listed by default, not filtered out. A payments screen showing
 * only successes cannot explain why a workspace lost its plan, which is the
 * commonest reason anybody opens one.
 */
export function PaymentsView() {
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<string>("");
  const { data } = usePaymentsSuspense({ page, limit: PAGE_SIZE, status });

  const lastPage = Math.max(0, Math.ceil(data.total / data.limit) - 1);

  function choose(next: string) {
    setStatus(next);
    // A filter that narrows the list while the reader is on page four leaves them
    // looking at an empty table for a set that does have rows.
    setPage(0);
  }

  return (
    <DetailShell>
      <PageHeader
        title="Payments"
        description="What customers have actually been charged, and whether it went through."
        info="The only record of money in this product. Credits are what a workspace may spend; these are the dollars that bought them, frozen at the amount charged."
        actions={
          <div className="flex items-center gap-3">
            <div className="flex rounded-md border p-0.5">
              {STATUSES.map((entry) => (
                <button
                  key={entry.value || "all"}
                  type="button"
                  onClick={() => choose(entry.value)}
                  className={cn(
                    "rounded px-3 py-1 text-sm transition-colors",
                    entry.value === status
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {entry.label}
                </button>
              ))}
            </div>

            {data.total > data.limit && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {data.offset + 1}–{data.offset + data.items.length} of {data.total}
                </span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Newer payments"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Older payments"
                  disabled={page >= lastPage}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>
        }
      />

      <section className="mt-6 rounded-lg border bg-background">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Workspace</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    {status
                      ? `No payment has the status "${status}".`
                      : "Nothing has been charged yet. Payments appear here once Stripe is configured and a customer pays."}
                  </TableCell>
                </TableRow>
              ) : (
                data.items.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                      {formatDateTime(payment.createdAt)}
                    </TableCell>
                    <TableCell className="max-w-48 truncate">
                      <Link
                        href={`/admin/workspaces/${payment.organizationId}`}
                        className="font-medium hover:underline"
                      >
                        {payment.workspaceName}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-64 truncate text-sm">
                      {payment.description}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{payment.kind}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                      {payment.periodStart && payment.periodEnd
                        ? `${payment.periodStart.slice(0, 10)} — ${payment.periodEnd.slice(0, 10)}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={tone(payment.status)}>{payment.status}</StatusBadge>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {money.format(payment.amountUsd)}
                    </TableCell>
                    <TableCell className="text-right">
                      {payment.hostedInvoiceUrl && (
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={payment.hostedInvoiceUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                          >
                            <ExternalLink className="size-4" />
                            Invoice
                          </a>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </DetailShell>
  );
}

export function PaymentsLoading() {
  return (
    <DetailShell>
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64" />
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Reading what has been charged...
        </p>
      </div>
    </DetailShell>
  );
}

export function PaymentsError() {
  return (
    <DetailShell>
      <div className="flex flex-col items-center gap-2 rounded-md border p-10 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <p className="font-medium">Could not load payments</p>
        <p className="max-w-md text-sm text-muted-foreground">
          The platform admin API refused or is unreachable. This screen needs the{" "}
          <code className="font-mono text-xs">admin.usage.read</code> permission, which the
          support role deliberately does not hold.
        </p>
      </div>
    </DetailShell>
  );
}
