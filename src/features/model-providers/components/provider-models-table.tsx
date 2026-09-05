"use client";

import { Trash2 } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber, formatUsd } from "@/lib/format";
import {
  useRemoveModel,
  useSetModelEnabled,
} from "../hooks/model-providers.hook";
import type {
  ModelProvider,
  ProviderModel,
} from "../service/model-providers.service";

function rateLabel(model: ProviderModel): string {
  if (model.capability === "embedding") {
    return `${formatUsd(model.rates.embeddingPerMillion)} / M`;
  }
  return `${formatUsd(model.rates.inputPerMillion)} in · ${formatUsd(model.rates.outputPerMillion)} out / M`;
}

export function ProviderModelsTable({ provider }: { provider: ModelProvider }) {
  const setEnabled = useSetModelEnabled(provider.id);
  const remove = useRemoveModel(provider.id);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Model</TableHead>
            <TableHead>Capability</TableHead>
            <TableHead>Tier</TableHead>
            <TableHead className="text-right">Context / width</TableHead>
            <TableHead>Rates</TableHead>
            <TableHead className="w-24">Offered</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {provider.models.map((model) => (
            <TableRow key={model.id}>
              <TableCell className="font-mono text-sm">
                <span className="flex items-center gap-2">
                  {model.model}
                  {model.custom && <StatusBadge tone="info">custom</StatusBadge>}
                </span>
              </TableCell>
              <TableCell className="text-sm">{model.capability}</TableCell>
              <TableCell>
                <StatusBadge tone={model.tier === "premium" ? "warning" : "neutral"}>
                  {model.tier}
                </StatusBadge>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {/* Chat models show their context window; an embedding model
                    shows its vector width, which is the number that decides
                    where its vectors are indexed. */}
                {model.capability === "embedding"
                  ? model.embeddingDimensions
                    ? `${formatNumber(model.embeddingDimensions)}d`
                    : "—"
                  : model.contextWindow
                    ? formatNumber(model.contextWindow)
                    : "—"}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {rateLabel(model)}
              </TableCell>
              <TableCell>
                <Switch
                  checked={model.enabled}
                  // A model whose provider has no key cannot be called, so
                  // offering it would only produce a failure at request time.
                  disabled={
                    !provider.credential.configured || setEnabled.isPending
                  }
                  aria-label={`Offer ${model.model}`}
                  onCheckedChange={(enabled) =>
                    setEnabled.mutate({ model: model.model, enabled })
                  }
                />
              </TableCell>
              <TableCell className="text-right">
                {model.custom && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${model.model}`}
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(model.model)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
