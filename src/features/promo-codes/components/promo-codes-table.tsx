"use client";

import { useState } from "react";

import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCredits, formatDate, formatDateTime } from "@/lib/format";
import { PromoCodeRowActions } from "./promo-code-row-actions";
import { PromoRedemptionsDialog } from "./promo-redemptions-dialog";
import type { PromoCode, PromoStatus } from "../service/promo-codes.service";

/**
 * Four states, and the backend decides which. It derives the same value when it
 * accepts or refuses a redemption, so a badge here can never disagree with what
 * a customer sees when they type the code in.
 */
const TONES: Record<PromoStatus, "success" | "warning" | "neutral"> = {
  active: "success",
  inactive: "neutral",
  expired: "warning",
  exhausted: "warning",
};

const LABELS: Record<PromoStatus, string> = {
  active: "active",
  inactive: "inactive",
  expired: "expired",
  exhausted: "used up",
};

export function PromoCodesTable({ promoCodes }: { promoCodes: PromoCode[] }) {
  const [inspecting, setInspecting] = useState<PromoCode | null>(null);

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead className="text-right">Credits</TableHead>
              <TableHead>Bucket</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="text-right">Redeemed</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promoCodes.map((promoCode) => (
              <TableRow
                key={promoCode.id}
                tabIndex={0}
                role="button"
                aria-label={`Redemptions for ${promoCode.code}`}
                className="group cursor-pointer"
                onClick={() => setInspecting(promoCode)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setInspecting(promoCode);
                  }
                }}
              >
                <TableCell className="font-mono font-medium underline-offset-4 group-hover:underline">
                  {promoCode.code}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCredits(promoCode.credits)}
                </TableCell>
                <TableCell>
                  <StatusBadge tone={promoCode.bucket === "topup" ? "info" : "neutral"}>
                    {promoCode.bucket}
                  </StatusBadge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(promoCode.expiresAt)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {promoCode.redeemedCount}
                  {promoCode.maxRedemptions !== null
                    ? ` / ${promoCode.maxRedemptions}`
                    : ""}
                </TableCell>
                <TableCell>
                  <StatusBadge tone={TONES[promoCode.status]}>
                    {LABELS[promoCode.status]}
                  </StatusBadge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <div className="leading-tight">
                    <div>{formatDateTime(promoCode.createdAt)}</div>
                    {/* Null once the account that created it is deleted. The
                        code stands; the attribution does not. */}
                    <div title={promoCode.createdBy?.email ?? undefined}>
                      by {promoCode.createdBy?.name ?? "a deleted account"}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <PromoCodeRowActions promoCode={promoCode} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {inspecting && (
        <PromoRedemptionsDialog
          promoCode={inspecting}
          open
          onOpenChange={(next) => {
            if (!next) setInspecting(null);
          }}
        />
      )}
    </>
  );
}
