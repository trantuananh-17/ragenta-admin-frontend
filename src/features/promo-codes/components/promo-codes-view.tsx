"use client";

import { AlertCircle, Loader2, Ticket } from "lucide-react";

import { DetailSection, DetailShell } from "@/components/detail-shell";
import { EntityStateView } from "@/components/entity-components";
import { PageHeader } from "@/components/page-header";
import { StatCard, StatCardGrid } from "@/components/stat-card";
import { formatCredits } from "@/lib/format";
import { usePromoCodesSuspense } from "../hooks/promo-codes.hook";
import { PromoCodeCreateForm } from "./promo-code-create-form";
import { PromoCodesTable } from "./promo-codes-table";

export function PromoCodesView() {
  const { data } = usePromoCodesSuspense();
  const promoCodes = data.items;

  const live = promoCodes.filter((code) => code.status === "active").length;
  const redemptions = promoCodes.reduce(
    (total, code) => total + code.redeemedCount,
    0,
  );
  // What the codes have handed out, from the code's current value. A code whose
  // credits were edited after a redemption would make this an approximation —
  // which is why the redemptions dialog shows the frozen per-redemption amount.
  const granted = promoCodes.reduce(
    (total, code) => total + code.redeemedCount * code.credits,
    0,
  );

  return (
    <DetailShell>
      <PageHeader
        title="Promo codes"
        description="Redeemable codes that grant credits to a workspace. One redemption per workspace, posted to the ledger exactly as a top-up is."
      />

      <StatCardGrid>
        <StatCard
          label="Redeemable now"
          value={live}
          hint={`${data.total} total`}
        />
        <StatCard
          label="Redemptions"
          value={redemptions}
          hint="Across every code"
        />
        <StatCard
          label="Credits granted"
          value={formatCredits(granted)}
          hint="What redemptions have handed out"
        />
      </StatCardGrid>

      <PromoCodeCreateForm />

      <DetailSection
        title="All codes"
        description={`${data.total} code${data.total === 1 ? "" : "s"}. Select a row to see who redeemed it.`}
      >
        {promoCodes.length === 0 ? (
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

export function PromoCodesLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export function PromoCodesError() {
  return (
    <EntityStateView
      icon={<AlertCircle className="size-8 text-destructive" />}
      title="Could not load promo codes"
      message="The backend refused or is unreachable."
    />
  );
}
