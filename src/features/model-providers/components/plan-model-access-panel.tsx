"use client";

import { useState } from "react";

import { DetailSection } from "@/components/detail-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  usePlanModelAccessSuspense,
  useSetPlanModelAccess,
} from "../hooks/model-providers.hook";
import {
  PLAN_NAMES,
  type ModelProvider,
  type ModelSelection,
  type PlanModelAccess,
  type PlanName,
} from "../service/model-providers.service";

const CAPABILITIES = [
  {
    id: "chat" as const,
    title: "Chat",
    info: "What a workspace on this plan may answer with. It picks one per conversation; the default is what it gets before it picks.",
  },
  {
    id: "embedding" as const,
    title: "Embedding",
    info: "Chosen once, when a knowledge base is created, and frozen after — vectors from two models cannot be compared. Narrowing this list does not move an existing base.",
  },
  {
    id: "rerank" as const,
    title: "Rerank",
    info: "A second pass over retrieved passages. Optional, priced per search, and set per knowledge base rather than workspace-wide — so there is no default to choose.",
  },
];

const PLAN_LABELS: Record<PlanName, string> = {
  free: "Free",
  pro: "Pro",
  team: "Team",
  enterprise: "Enterprise",
};

interface Offered {
  key: string;
  provider: string;
  providerName: string;
  model: string;
  tier: string;
}

const keyOf = (selection: ModelSelection) =>
  `${selection.provider}:${selection.model}`;

/**
 * Only models a workspace could actually run: offered, and from a provider that
 * holds a key. Listing the rest would let an administrator build an allowlist
 * out of models that fail at the moment somebody picks one.
 */
function offeredModels(
  providers: ModelProvider[],
  capability: string,
): Offered[] {
  return providers.flatMap((provider) =>
    provider.credential.configured && provider.supported
      ? provider.models
          .filter((model) => model.capability === capability && model.enabled)
          .map((model) => ({
            key: `${provider.id}:${model.model}`,
            provider: provider.id,
            providerName: provider.name,
            model: model.model,
            tier: model.tier,
          }))
      : [],
  );
}

function CapabilitySection({
  title,
  info,
  offered,
  allowed,
  onAllowedChange,
  fallback,
  selected,
  onSelectedChange,
}: {
  title: string;
  info: string;
  offered: Offered[];
  allowed: string[];
  onAllowedChange: (next: string[]) => void;
  /** What an empty allowlist falls back to, spelled out for the reader. */
  fallback: string;
  /** Omitted for rerank, which has no workspace-wide default. */
  selected?: ModelSelection | null;
  onSelectedChange?: (next: ModelSelection | null) => void;
}) {
  const unrestricted = allowed.length === 0;
  const defaultChoices = unrestricted
    ? offered
    : offered.filter((entry) => allowed.includes(entry.key));

  const toggle = (key: string, on: boolean) => {
    onAllowedChange(
      on ? [...allowed, key] : allowed.filter((entry) => entry !== key),
    );
    // A default that just left the list would be saved and immediately refused
    // by the backend, so it is dropped here rather than turned into a 422.
    if (!on && selected && keyOf(selected) === key) onSelectedChange?.(null);
  };

  return (
    <DetailSection title={title} info={info}>
      {offered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No {title.toLowerCase()} model is offered by a provider that holds a
          key, so there is nothing to allow yet.
        </p>
      ) : (
        <div className="space-y-4">
          {onSelectedChange && (
            <div className="grid max-w-md gap-2">
              <Label htmlFor={`${title}-default`}>Default</Label>
              <Select
                value={selected ? keyOf(selected) : "platform"}
                onValueChange={(next) => {
                  if (next === "platform") return onSelectedChange(null);
                  const choice = defaultChoices.find(
                    (entry) => entry.key === next,
                  );
                  if (choice)
                    onSelectedChange({
                      provider: choice.provider,
                      model: choice.model,
                    });
                }}
              >
                <SelectTrigger id={`${title}-default`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="platform">Platform default</SelectItem>
                  {defaultChoices.map((entry) => (
                    <SelectItem key={entry.key} value={entry.key}>
                      {entry.providerName} · {entry.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Label>Models this plan may run</Label>
              {unrestricted ? (
                <Badge variant="secondary">{fallback}</Badge>
              ) : (
                <Badge variant="outline">{allowed.length} selected</Badge>
              )}
              {!unrestricted && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onAllowedChange([])}
                >
                  Clear
                </Button>
              )}
            </div>

            <div className="grid max-h-72 gap-1 overflow-y-auto rounded-md border p-2 sm:grid-cols-2">
              {offered.map((entry) => (
                <label
                  key={entry.key}
                  className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted/60"
                >
                  <Checkbox
                    checked={allowed.includes(entry.key)}
                    onCheckedChange={(next) => toggle(entry.key, next === true)}
                  />
                  <span className="min-w-0 flex-1 truncate">{entry.model}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {entry.providerName}
                  </span>
                  <Badge
                    variant={entry.tier === "premium" ? "default" : "secondary"}
                    className="shrink-0 text-[10px]"
                  >
                    {entry.tier}
                  </Badge>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </DetailSection>
  );
}

/**
 * Which models each plan may offer its workspaces.
 *
 * The rule this narrows is the tier gate in the backend's `plans.ts`: free runs
 * economy models, paid plans run everything. That was fine while the catalogue
 * was a dozen hand-written entries and is not once a provider catalogue has been
 * imported — a customer should not scroll three hundred models to find the four
 * this deployment actually wants sold at their price.
 *
 * Leaving a list empty keeps the tier rule for that plan and capability, so this
 * screen is opt-in per plan rather than something that has to be filled in
 * before anything works.
 */
export function PlanModelAccessPanel({
  providers,
}: {
  providers: ModelProvider[];
}) {
  const access = usePlanModelAccessSuspense();
  const [plan, setPlan] = useState<PlanName>("free");
  const save = useSetPlanModelAccess(plan);

  const server = access.data[plan];
  const [draft, setDraft] = useState<PlanModelAccess>(server);
  const [lastServerValue, setLastServerValue] = useState(server);

  // Adjusted during render rather than in an effect, so switching plan never
  // shows the previous plan's selection for a frame.
  if (server !== lastServerValue) {
    setLastServerValue(server);
    setDraft(server);
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(server);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Model access by plan"
        description="An empty list keeps the plan's tier rule."
        info="Which models each plan may run, and what it runs before a workspace chooses. Ticking nothing changes nothing: the plan keeps the tier rule it has always had, so this screen is opt-in per plan and per capability."
      />

      <Tabs
        value={plan}
        onValueChange={(next) => setPlan(next as PlanName)}
      >
        <TabsList>
          {PLAN_NAMES.map((name) => (
            <TabsTrigger key={name} value={name}>
              {PLAN_LABELS[name]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {CAPABILITIES.map((capability) => {
        const fallback =
          plan === "free" ? "economy models only" : "every offered model";
        const offered = offeredModels(providers, capability.id);

        // Rerank is split out rather than branched inside, because it is the one
        // bucket with no `default` field at all — there is nothing to narrow.
        if (capability.id === "rerank") {
          return (
            <CapabilitySection
              key={capability.id}
              title={capability.title}
              info={capability.info}
              offered={offered}
              allowed={draft.rerank.allowed}
              fallback={fallback}
              onAllowedChange={(allowed) =>
                setDraft({ ...draft, rerank: { allowed } })
              }
            />
          );
        }

        const bucket = draft[capability.id];
        return (
          <CapabilitySection
            key={capability.id}
            title={capability.title}
            info={capability.info}
            offered={offered}
            allowed={bucket.allowed}
            fallback={fallback}
            onAllowedChange={(allowed) =>
              setDraft({ ...draft, [capability.id]: { ...bucket, allowed } })
            }
            selected={bucket.default}
            onSelectedChange={(next) =>
              setDraft({ ...draft, [capability.id]: { ...bucket, default: next } })
            }
          />
        );
      })}

      <div className="flex justify-end">
        <Button
          disabled={!dirty || save.isPending}
          onClick={() => save.mutate(draft)}
        >
          {save.isPending ? "Saving..." : `Save ${PLAN_LABELS[plan]} access`}
        </Button>
      </div>
    </div>
  );
}
