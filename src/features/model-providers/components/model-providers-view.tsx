"use client";

import { useState } from "react";

import { PrototypeNotice } from "@/components/prototype-notice";
import { Skeleton } from "@/components/ui/skeleton";
import {
  usePlatformDefaults,
  useProviders,
} from "../hooks/model-providers.hook";
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
  const { data: providers, isPending } = useProviders();
  const { data: defaults, isPending: defaultsPending } = usePlatformDefaults();

  const list = providers ?? [];
  const selected = list.find((provider) => provider.id === selection);

  return (
    <div className="flex h-full flex-col overflow-hidden md:flex-row">
      <div className="w-full shrink-0 md:h-full md:w-72 md:overflow-hidden">
        <ProviderList
          providers={list}
          isPending={isPending}
          selection={selection}
          onSelect={setSelection}
        />
      </div>

      <div className="min-w-0 flex-1 space-y-6 overflow-y-auto p-4 md:px-10 md:py-6">
        <PrototypeNotice>
          ragenta-backend reads provider keys from environment variables and
          ships its model catalogue as source, so there is nothing on this screen
          for it to store yet. Changes live in this browser tab and are gone on
          reload.
        </PrototypeNotice>

        {isPending ? (
          <Skeleton className="h-64 w-full" />
        ) : selection === null ? (
          <PlatformDefaultsPanel
            providers={list}
            defaults={defaults}
            isPending={defaultsPending}
          />
        ) : selected ? (
          <ProviderPanel provider={selected} />
        ) : null}
      </div>
    </div>
  );
}
