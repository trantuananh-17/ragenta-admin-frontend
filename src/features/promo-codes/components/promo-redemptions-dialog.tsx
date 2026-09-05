"use client";

import Link from "next/link";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCredits, formatDateTime } from "@/lib/format";
import type { PromoCode } from "../service/promo-codes.service";

/**
 * Who claimed a code. One dialog for the whole table rather than one per row —
 * only ever a single code is being inspected.
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
  const { redemptions } = promoCode;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-mono">{promoCode.code}</DialogTitle>
          <DialogDescription>
            {redemptions.length === 0
              ? "Nobody has redeemed this code."
              : `${redemptions.length} redemption${redemptions.length === 1 ? "" : "s"}, ${formatCredits(promoCode.credits)} credits each.`}
          </DialogDescription>
        </DialogHeader>

        {redemptions.length > 0 && (
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
                        {redemption.workspaceName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="leading-tight">
                        <div>{redemption.redeemedBy.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {redemption.redeemedBy.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
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
        )}
      </DialogContent>
    </Dialog>
  );
}
