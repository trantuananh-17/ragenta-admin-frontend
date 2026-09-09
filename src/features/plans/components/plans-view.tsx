"use client";

import { AlertCircle } from "lucide-react";

import { DetailSection, DetailShell } from "@/components/detail-shell";
import { EntityStateView } from "@/components/entity-components";
import { PageHeader } from "@/components/page-header";
import { StatCard, StatCardGrid } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Spinner } from "@/components/ui/spinner";
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

/**
 * A plan with neither figure is refilled by nothing, and that is two different
 * situations an operator has to tell apart: free is funded once by the signup
 * grant, enterprise by whatever its contract says.
 */
function refillLabel(plan: PlanEntry): string {
  if (plan.flatCredits !== null) return `${formatCredits(plan.flatCredits)} flat`;
  if (plan.creditsPerSeat !== null)
    return `${formatCredits(plan.creditsPerSeat)} per seat`;
  if (plan.price.monthlyUsd === 0) return "Signup grant only";
  return "By agreement";
}

/** A counted plan cap. `null` is unlimited, `0` is the capability withheld. */
function countLabel(limit: number | null): string {
  return limit === null ? "Unlimited" : String(limit);
}

function FeatureCell({ included }: { included: boolean }) {
  return included ? (
    <StatusBadge tone="success">included</StatusBadge>
  ) : (
    <StatusBadge>off</StatusBadge>
  );
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
          hint="The whole of the free tier: once per account, on the first workspace it creates, after email verification. Nothing is granted after it."
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
                <TableHead>Knowledge bases</TableHead>
                <TableHead>Agents</TableHead>
                <TableHead>Widgets</TableHead>
                <TableHead>API keys</TableHead>
                <TableHead>Data sources</TableHead>
                <TableHead>Webhooks and triggers</TableHead>
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
                  <TableCell>{countLabel(plan.knowledgeBaseLimit)}</TableCell>
                  <TableCell>{countLabel(plan.agentLimit)}</TableCell>
                  <TableCell>{countLabel(plan.widgetLimit)}</TableCell>
                  <TableCell>
                    <FeatureCell included={plan.apiKeysEnabled} />
                  </TableCell>
                  <TableCell>
                    <FeatureCell included={plan.dataSourcesEnabled} />
                  </TableCell>
                  <TableCell>
                    <FeatureCell included={plan.automationEnabled} />
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
      <Spinner className="size-8 text-muted-foreground" />
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
