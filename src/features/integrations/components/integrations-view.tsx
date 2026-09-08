"use client";

import { useState } from "react";
import { Plug, Plus } from "lucide-react";

import { DetailShell } from "@/components/detail-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useIntegrationsSuspense } from "../hooks/integrations.hook";
import { IntegrationDialog } from "./integration-dialog";
import { IntegrationCard } from "./integration-card";

/**
 * Connections an agent may act on.
 *
 * Cards rather than a table: what an administrator needs to see at a glance is
 * not a row of fields but a *scope* — what this connection can reach and what it
 * is allowed to do through it — and that reads as a small block, not a cell.
 */
export function IntegrationsView() {
  const { data } = useIntegrationsSuspense();
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const current = data.find((entry) => entry.id === editing) ?? null;

  return (
    <DetailShell>
      <PageHeader
        title="Connections"
        description="Outside systems an agent may reach. Each one carries its own limits — which methods, which paths, which recipients — and an agent can never widen them."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            New connection
          </Button>
        }
      />

      {data.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-10 text-center">
          <Plug className="size-8 text-muted-foreground" />
          <div>
            <p className="font-medium">No connections yet</p>
            <p className="text-sm text-muted-foreground">
              Without one, an agent can read documents and public web pages but
              cannot act on anything.
            </p>
          </div>
          <Button variant="outline" onClick={() => setCreating(true)}>
            New connection
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((entry) => (
            <IntegrationCard
              key={entry.id}
              integration={entry}
              onEdit={() => setEditing(entry.id)}
            />
          ))}
        </div>
      )}

      <IntegrationDialog
        open={creating || current !== null}
        integration={current}
        onOpenChange={(open) => {
          if (open) return;
          setCreating(false);
          setEditing(null);
        }}
      />
    </DetailShell>
  );
}

/** Which tool ids a connection unlocks, so the page says what it is *for*. */
export function KindBadge({ kind }: { kind: string }) {
  const label =
    kind === "web_search"
      ? "web_search"
      : kind === "email"
        ? "send_email"
        : "api_call";
  return <StatusBadge tone="info">{label}</StatusBadge>;
}

export function IntegrationsLoading() {
  return (
    <DetailShell>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((card) => (
          <Skeleton key={card} className="h-44 rounded-lg" />
        ))}
      </div>
    </DetailShell>
  );
}

export function IntegrationsError() {
  return (
    <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
      Connections could not be loaded.
    </div>
  );
}
