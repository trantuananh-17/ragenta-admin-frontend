"use client";

import { useState } from "react";
import { ChevronRight, Search, SlidersHorizontal } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ModelProvider } from "../service/model-providers.service";

/** `null` is the platform-defaults pane; anything else is a provider id. */
export type ProviderSelection = string | null;

export function ProviderList({
  providers,
  isPending,
  selection,
  onSelect,
}: {
  providers: ModelProvider[];
  isPending: boolean;
  selection: ProviderSelection;
  onSelect: (selection: ProviderSelection) => void;
}) {
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();
  const matching = query
    ? providers.filter((provider) =>
        provider.name.toLowerCase().includes(query),
      )
    : providers;
  // Configured providers first: the list is long, and the ones carrying a key
  // are the ones an admin came here to look at.
  const ordered = [
    ...matching.filter((provider) => provider.credential.configured),
    ...matching.filter((provider) => !provider.credential.configured),
  ];

  return (
    <div className="flex h-full flex-col gap-3 border-b p-4 md:border-r md:border-b-0">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          "flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors",
          selection === null
            ? "border-primary/30 bg-primary/10 font-medium text-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="size-4" />
          Platform defaults
        </span>
        <ChevronRight className="size-4" />
      </button>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search providers"
          aria-label="Search providers"
          className="pl-8"
        />
      </div>

      <div className="flex flex-col gap-1 overflow-y-auto">
        {isPending ? (
          <>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </>
        ) : ordered.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            No provider matches “{search}”.
          </p>
        ) : (
          ordered.map((provider) => (
            <button
              key={provider.id}
              type="button"
              onClick={() => onSelect(provider.id)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
                selection === provider.id
                  ? "bg-primary/10 font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded bg-muted text-[11px] font-semibold text-foreground">
                {provider.name.slice(0, 1)}
              </span>
              <span className="flex-1 truncate">{provider.name}</span>
              {provider.credential.configured && (
                <span
                  aria-label="key configured"
                  className="size-2 shrink-0 rounded-full bg-emerald-500"
                />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
