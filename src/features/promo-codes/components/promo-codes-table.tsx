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
import type { PromoCode } from "../service/promo-codes.service";

/**
 * Three states, not two. A code can be switched off by an admin, or simply run
 * out of time — and "inactive" on a code somebody deliberately paused means
 * something different from a code that quietly expired last week.
 */
function statusOf(promoCode: PromoCode) {
  if (!promoCode.active) return { tone: "neutral" as const, label: "inactive" };
  if (new Date(promoCode.expiresAt).valueOf() <= Date.now()) {
    return { tone: "warning" as const, label: "expired" };
  }
  if (
    promoCode.maxRedemptions !== null &&
    promoCode.redemptions.length >= promoCode.maxRedemptions
  ) {
    return { tone: "warning" as const, label: "used up" };
  }
  return { tone: "success" as const, label: "active" };
}

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
            {promoCodes.map((promoCode) => {
              const status = statusOf(promoCode);
              return (
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
                    {promoCode.redemptions.length}
                    {promoCode.maxRedemptions !== null
                      ? ` / ${promoCode.maxRedemptions}`
                      : ""}
                  </TableCell>
                  <TableCell>
                    <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div className="leading-tight">
                      <div>{formatDateTime(promoCode.createdAt)}</div>
                      <div title={promoCode.createdBy.email}>
                        by {promoCode.createdBy.name}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <PromoCodeRowActions promoCode={promoCode} />
                  </TableCell>
                </TableRow>
              );
            })}
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
