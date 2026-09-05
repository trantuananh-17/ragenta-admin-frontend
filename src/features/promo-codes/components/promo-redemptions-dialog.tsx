"use client";

import Link from "next/link";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCredits, formatDateTime } from "@/lib/format";
import { usePromoRedemptions } from "../hooks/promo-codes.hook";
import type { PromoCode } from "../service/promo-codes.service";

/**
 * Who claimed a code, fetched when the dialog opens. One dialog for the whole
 * table rather than one per row — only ever a single code is being inspected,
 * and the list endpoint deliberately does not carry redemptions.
 */
export function PromoRedemptionsDialog({
  promoCode,
  open,
  onOpenChange,
}: {
  promoCode: PromoCode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isPending } = usePromoRedemptions(promoCode.id, open);
  const redemptions = data?.items ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-mono">{promoCode.code}</DialogTitle>
          <DialogDescription>
            {isPending
              ? "Loading redemptions..."
              : redemptions.length === 0
                ? "Nobody has redeemed this code."
                : `${data?.total ?? redemptions.length} redemption${(data?.total ?? redemptions.length) === 1 ? "" : "s"}, ${formatCredits(promoCode.credits)} credits each.`}
          </DialogDescription>
        </DialogHeader>

        {isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : redemptions.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workspace</TableHead>
                  <TableHead>Redeemed by</TableHead>
                  <TableHead className="text-right">Credits</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {redemptions.map((redemption) => (
                  <TableRow key={redemption.id}>
                    <TableCell>
                      <Link
                        href={`/admin/workspaces/${redemption.workspaceId}`}
                        className="font-medium hover:underline"
                      >
                        {redemption.workspaceName ?? redemption.workspaceId}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {redemption.redeemedBy ? (
                        <div className="leading-tight">
                          <div>{redemption.redeemedBy.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {redemption.redeemedBy.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          a deleted account
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {/* Frozen at redemption time — the code may have been
                          edited since, and this is what was actually granted. */}
                      {formatCredits(redemption.credits)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(redemption.redeemedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
