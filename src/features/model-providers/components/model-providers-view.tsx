"use client";

import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { EntityStateView } from "@/components/entity-components";
import { useProvidersSuspense } from "../hooks/model-providers.hook";
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
          <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
            <p className="font-medium">Keys cannot be stored on this deployment</p>
            <p className="text-amber-800/80 dark:text-amber-300/80">
              <code>SECRETS_ENCRYPTION_KEY</code> is unset, so the backend
              refuses to save a provider key rather than writing it unencrypted.
              Set it (<code>openssl rand -base64 32</code>) and restart the API
              and worker. Keys already supplied as environment variables keep
              working.
            </p>
          </div>
        )}

        {selection === null ? (
          <PlatformDefaultsPanel
            providers={data.providers}
            defaults={data.defaults}
          />
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
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
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
