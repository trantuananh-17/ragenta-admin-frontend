"use client";

import { AlertCircle, Loader2 } from "lucide-react";

import { DetailSection, DetailShell } from "@/components/detail-shell";
import { EntityStateView } from "@/components/entity-components";
import { PageHeader } from "@/components/page-header";
import { StatCard, StatCardGrid } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePlansSuspense } from "@/features/plans/hooks/plans.hook";
import { formatCredits, formatUsd } from "@/lib/format";
import type { PlanEntry } from "@/features/plans/service/plans.service";

function priceLabel(plan: PlanEntry): string {
  const { price } = plan;
  if (price.perSeatUsd !== null) return `${formatUsd(price.perSeatUsd)} / seat`;
  if (price.monthlyUsd !== null) return `${formatUsd(price.monthlyUsd)} / month`;
  return "Invoiced by hand";
}

function refillLabel(plan: PlanEntry): string {
  if (plan.flatCredits !== null) return `${formatCredits(plan.flatCredits)} flat`;
  if (plan.creditsPerSeat !== null)
    return `${formatCredits(plan.creditsPerSeat)} per seat`;
  return "One-time grant only";
}

export function PlansView() {
  const { data } = usePlansSuspense();

  return (
    <DetailShell>
      <PageHeader
        title="Plans and pricing"
        description="Read-only. These numbers live in the backend's plan catalogue, which is also what the seat cap and the refill job read — so a price here is a price that is actually enforced."
      />

      <StatCardGrid>
        <StatCard
          label="Signup grant"
          value={formatCredits(data.signupGrantCredits)}
          hint="One-time, on the free plan. Never refilled."
        />
        {data.topupPacks.map((pack) => (
          <StatCard
            key={pack.id}
            label={`Top-up ${pack.id}`}
            value={formatUsd(pack.priceUsd)}
            hint={`${formatCredits(pack.credits)} credits · ${formatUsd(pack.usdPerMillionCredits)}/M`}
          />
        ))}
      </StatCardGrid>

      <DetailSection title="Plans">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Credits per refill</TableHead>
                <TableHead>Model tiers</TableHead>
                <TableHead>Top-ups</TableHead>
                <TableHead>Self-serve</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.plans.map((plan) => (
                <TableRow key={plan.name}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>{priceLabel(plan)}</TableCell>
                  <TableCell>{plan.seatLimit ?? "Unlimited"}</TableCell>
                  <TableCell>{refillLabel(plan)}</TableCell>
                  <TableCell className="text-xs">
                    {plan.modelTiers.join(", ")}
                  </TableCell>
                  <TableCell>
                    {plan.topupsEnabled ? (
                      <StatusBadge tone="success">allowed</StatusBadge>
                    ) : (
                      <StatusBadge>off</StatusBadge>
                    )}
                  </TableCell>
                  <TableCell>
                    {plan.stripePriceKey ? (
                      <StatusBadge tone="info">checkout</StatusBadge>
                    ) : (
                      <StatusBadge>contact sales</StatusBadge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DetailSection>
    </DetailShell>
  );
}

export function PlansLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export function PlansError() {
  return (
    <EntityStateView
      icon={<AlertCircle className="size-8 text-destructive" />}
      title="Could not load the plan catalogue"
      message="The backend refused or is unreachable."
    />
  );
}
