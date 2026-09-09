"use client";

import { useState } from "react";
import { AlertCircle, TriangleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { EntityStateView } from "@/components/entity-components";
import { useProvidersSuspense } from "../hooks/model-providers.hook";
import { PlanModelAccessPanel } from "./plan-model-access-panel";
import { PlatformDefaultsPanel } from "./platform-defaults-panel";
import { ProviderList, type ProviderSelection } from "./provider-list";
import { ProviderPanel } from "./provider-panel";

/**
 * Two columns: the provider list on the left, and either the platform defaults
 * or one provider on the right. The shape follows RAGFlow's model settings,
 * which solves the same problem — a long provider list where only a few are
 * configured, and each configured one has its own credential and model set.
 */
export function ModelProvidersView() {
  const [selection, setSelection] = useState<ProviderSelection>(null);
  const { data } = useProvidersSuspense();

  const selected = data.providers.find((provider) => provider.id === selection);

  return (
    <div className="flex h-full flex-col overflow-hidden md:flex-row">
      <div className="w-full shrink-0 md:h-full md:w-72 md:overflow-hidden">
        <ProviderList
          providers={data.providers}
          selection={selection}
          onSelect={setSelection}
        />
      </div>

      <div className="min-w-0 flex-1 space-y-6 overflow-y-auto p-4 md:px-10 md:py-6">
        {/* A deployment with no SECRETS_ENCRYPTION_KEY refuses to store a key
            rather than writing one in the clear. Saying so here is the only way
            an operator finds out why the save button will not work. */}
        {!data.encryptionConfigured && (
          <Alert variant="warning">
            <TriangleAlert />
            <AlertTitle>Keys cannot be stored on this deployment</AlertTitle>
            <AlertDescription>
              <code>SECRETS_ENCRYPTION_KEY</code> is unset, so the backend
              refuses to save a provider key rather than writing it unencrypted.
              Set it (<code>openssl rand -base64 32</code>) and restart the API
              and worker. Keys already supplied as environment variables keep
              working.
            </AlertDescription>
          </Alert>
        )}

        {selection === null ? (
          <>
            <PlatformDefaultsPanel
              providers={data.providers}
              defaults={data.defaults}
            />
            <PlanModelAccessPanel providers={data.providers} />
          </>
        ) : selected ? (
          <ProviderPanel provider={selected} />
        ) : null}
      </div>
    </div>
  );
}

export function ModelProvidersLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner className="size-8 text-muted-foreground" />
    </div>
  );
}

export function ModelProvidersError() {
  return (
    <EntityStateView
      icon={<AlertCircle className="size-8 text-destructive" />}
      title="Could not load model providers"
      message="The backend refused or is unreachable."
    />
  );
}
