"use client";

import { CheckCircle2, Pencil, Trash2, XCircle } from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useCheckIntegration, useDeleteIntegration } from "../hooks/integrations.hook";
import type { Integration } from "../service/integrations.service";
import { KindBadge } from "./integrations-view";

/**
 * One connection, and above all what it is *allowed* to do.
 *
 * The allowlist is shown on the card rather than hidden behind Edit because it
 * is the thing that is easy to get wrong and expensive to get wrong: a
 * connection quietly configured to allow DELETE on every path is not something
 * anyone should have to open a dialog to discover.
 */
export function IntegrationCard({
  integration,
  onEdit,
}: {
  integration: Integration;
  onEdit: () => void;
}) {
  const check = useCheckIntegration();
  const remove = useDeleteIntegration();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="space-y-3 rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{integration.name}</p>
          <p className="truncate font-mono text-[11px] text-muted-foreground">
            {integration.id}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <KindBadge kind={integration.kind} />
          <StatusBadge tone={integration.enabled ? "success" : "neutral"}>
            {integration.enabled ? "on" : "off"}
          </StatusBadge>
        </div>
      </div>

      {integration.description && (
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {integration.description}
        </p>
      )}

      <dl className="space-y-1 text-xs">
        {integration.baseUrl && (
          <Row label="Base URL" value={integration.baseUrl} />
        )}
        {integration.kind === "http_api" && (
          <>
            <Row label="Methods" value={integration.allowedMethods.join(", ") || "none"} />
            <Row
              label="Paths"
              value={integration.allowedPathPrefix || "the whole host"}
            />
          </>
        )}
        {integration.kind === "email" && (
          <Row
            label="Recipients"
            value={integration.allowedRecipients.join(", ") || "none — every send refused"}
          />
        )}
        <Row
          label="Key"
          value={integration.hasSecret ? (integration.secretHint ?? "stored") : "none"}
        />
      </dl>

      {integration.lastCheckedAt && (
        <p className="flex items-center gap-1.5 text-xs">
          {integration.lastCheckOk ? (
            <CheckCircle2 className="size-3.5 text-emerald-600" />
          ) : (
            <XCircle className="size-3.5 text-destructive" />
          )}
          <span className="text-muted-foreground">
            {integration.lastCheckOk ? "Answered" : integration.lastCheckError}
          </span>
        </p>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={check.isPending}
          onClick={() => check.mutate(integration.id)}
        >
          {check.isPending ? "Checking…" : "Test connection"}
        </Button>
        <Button size="sm" variant="outline" onClick={onEdit}>
          <Pencil className="size-3.5" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirming(true)}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Delete "${integration.name}"?`}
        description="Any agent configured to use it will start refusing that tool. The key is destroyed with the row."
        confirmLabel="Delete connection"
        destructive
        pending={remove.isPending}
        onConfirm={() => remove.mutate(integration.id, { onSuccess: () => setConfirming(false) })}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 truncate">{value}</dd>
    </div>
  );
}
