"use client";

import { useState } from "react";
import { Boxes, Plus } from "lucide-react";

import { DetailSection } from "@/components/detail-shell";
import { EntityStateView } from "@/components/entity-components";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { AddModelDialog } from "./add-model-dialog";
import { ProviderCredentialForm } from "./provider-credential-form";
import { ProviderModelsTable } from "./provider-models-table";
import type { ModelProvider } from "../service/model-providers.service";

export function ProviderPanel({ provider }: { provider: ModelProvider }) {
  const [addingModel, setAddingModel] = useState(false);

  const offered = provider.models.filter((model) => model.enabled).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={provider.name}
        description={provider.description}
        badges={
          provider.supported ? (
            <StatusBadge tone="info">adapter shipped</StatusBadge>
          ) : (
            <StatusBadge tone="warning">no adapter</StatusBadge>
          )
        }
      />

      {!provider.supported && (
        <p className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
          ragenta-backend has no client for {provider.name}. A key stored here
          would sit unused until one is written, and the models below would never
          be callable — so treat this as planning, not configuration.
        </p>
      )}

      <ProviderCredentialForm provider={provider} />

      <DetailSection
        title="Models"
        description={
          provider.models.length === 0
            ? "Nothing in the catalogue for this provider yet."
            : `${offered} of ${provider.models.length} offered to workspaces. A plan still decides which tier a workspace may pick from.`
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddingModel(true)}
          >
            <Plus className="size-4" />
            Add model
          </Button>
        }
      >
        {provider.models.length === 0 ? (
          <EntityStateView
            icon={<Boxes />}
            title="No models"
            message="Add one and it becomes selectable once this provider has a key."
          />
        ) : (
          <ProviderModelsTable provider={provider} />
        )}
      </DetailSection>

      <AddModelDialog
        provider={provider}
        open={addingModel}
        onOpenChange={setAddingModel}
      />
    </div>
  );
}
