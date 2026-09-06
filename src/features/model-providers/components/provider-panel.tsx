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

/**
 * The first sentence, for the line under the title. A provider like OpenRouter
 * carries a paragraph explaining namespaced model ids and why its catalogue is
 * imported rather than compiled in — worth keeping, not worth reading again
 * every time somebody opens the panel to paste a key.
 */
function summary(description: string): string {
  const end = description.indexOf(". ");
  return end === -1 ? description : description.slice(0, end + 1);
}

export function ProviderPanel({ provider }: { provider: ModelProvider }) {
  const [addingModel, setAddingModel] = useState(false);

  const offered = provider.models.filter((model) => model.enabled).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={provider.name}
        description={summary(provider.description)}
        info={provider.description}
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
            : `${offered} of ${provider.models.length} offered to workspaces.`
        }
        info="Offering a model makes it eligible; a plan's tier rule and its model allowlist still decide which workspaces may pick it."
        actions={
          <Button
            variant="outline"
            size="sm"
            // A model is only worth adding for a provider the backend can call;
            // the rest of the list is here to show the shape of the roadmap.
            disabled={!provider.supported}
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
