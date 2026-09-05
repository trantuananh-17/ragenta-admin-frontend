"use client";

import { Ticket } from "lucide-react";

import { DetailSection, DetailShell } from "@/components/detail-shell";
import { EntityStateView } from "@/components/entity-components";
import { PageHeader } from "@/components/page-header";
import { PrototypeNotice } from "@/components/prototype-notice";
import { StatCard, StatCardGrid } from "@/components/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCredits } from "@/lib/format";
import { usePromoCodes } from "../hooks/promo-codes.hook";
import { PromoCodeCreateForm } from "./promo-code-create-form";
import { PromoCodesTable } from "./promo-codes-table";
import type { PromoCode } from "../service/promo-codes.service";

function isLive(promoCode: PromoCode): boolean {
  if (!promoCode.active) return false;
  if (new Date(promoCode.expiresAt).valueOf() <= Date.now()) return false;
  return (
    promoCode.maxRedemptions === null ||
    promoCode.redemptions.length < promoCode.maxRedemptions
  );
}

export function PromoCodesView() {
  const { data, isPending } = usePromoCodes();
  const promoCodes = data ?? [];

  const live = promoCodes.filter(isLive).length;
  const redemptions = promoCodes.reduce(
    (total, promoCode) => total + promoCode.redemptions.length,
    0,
  );
  const granted = promoCodes.reduce(
    (total, promoCode) =>
      total + promoCode.redemptions.length * promoCode.credits,
    0,
  );

  return (
    <DetailShell>
      <PageHeader
        title="Promo codes"
        description="Redeemable codes that grant credits to a workspace. One redemption per workspace."
      />

      <PrototypeNotice>
        ragenta-backend has no promo-code module yet, so nothing on this screen
        crosses the network. What you create lives in this browser tab and is
        gone on reload.
      </PrototypeNotice>

      <StatCardGrid>
        <StatCard
          label="Redeemable now"
          value={isPending ? "—" : live}
          hint={`${promoCodes.length} total`}
        />
        <StatCard
          label="Redemptions"
          value={isPending ? "—" : redemptions}
          hint="Across every code"
        />
        <StatCard
          label="Credits granted"
          value={isPending ? "—" : formatCredits(granted)}
          hint="What redemptions have handed out"
        />
      </StatCardGrid>

      <PromoCodeCreateForm />

      <DetailSection
        title="All codes"
        description={
          isPending
            ? "Loading..."
            : `${promoCodes.length} code${promoCodes.length === 1 ? "" : "s"}. Select a row to see who redeemed it.`
        }
      >
        {isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : promoCodes.length === 0 ? (
          <EntityStateView
            icon={<Ticket />}
            title="No promo codes"
            message="Create one above and it appears here."
          />
        ) : (
          <PromoCodesTable promoCodes={promoCodes} />
        )}
      </DetailSection>
    </DetailShell>
  );
}
