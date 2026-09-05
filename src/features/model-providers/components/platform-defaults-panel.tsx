"use client";

import { useState } from "react";

import { DetailSection } from "@/components/detail-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useSetPlatformDefaults } from "../hooks/model-providers.hook";
import type {
  ModelCapability,
  ModelProvider,
  ModelSelection,
  PlatformModelDefaults,
} from "../service/model-providers.service";

interface Choice {
  key: string;
  label: string;
  selection: ModelSelection;
  available: boolean;
}

const keyOf = (selection: ModelSelection) =>
  `${selection.provider}:${selection.model}`;

/**
 * What a workspace could actually be pointed at: a model that is offered, by a
 * provider that holds a key. The current selection is always included even when
 * it fails that test, so a default that has become uncallable is visible rather
 * than silently blank.
 */
function choicesFor(
  providers: ModelProvider[],
  capability: ModelCapability,
  current: ModelSelection,
): Choice[] {
  const choices = providers.flatMap((provider) =>
    provider.models
      .filter(
        (model) =>
          model.capability === capability &&
          model.enabled &&
          provider.credential.configured,
      )
      .map((model) => ({
        key: `${provider.id}:${model.model}`,
        label: `${provider.name} · ${model.model}`,
        selection: { provider: provider.id, model: model.model },
        available: true,
      })),
  );

  if (choices.some((choice) => choice.key === keyOf(current))) return choices;
  return [
    {
      key: keyOf(current),
      label: `${current.provider} · ${current.model} (unavailable)`,
      selection: current,
      available: false,
    },
    ...choices,
  ];
}

function DefaultSelect({
  id,
  label,
  hint,
  choices,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  choices: Choice[];
  value: ModelSelection;
  onChange: (selection: ModelSelection) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={keyOf(value)}
        onValueChange={(next) => {
          const choice = choices.find((entry) => entry.key === next);
          if (choice) onChange(choice.selection);
        }}
      >
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {choices.map((choice) => (
            <SelectItem key={choice.key} value={choice.key}>
              {choice.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export function PlatformDefaultsPanel({
  providers,
  defaults,
  isPending,
}: {
  providers: ModelProvider[];
  defaults: PlatformModelDefaults | undefined;
  isPending: boolean;
}) {
  const save = useSetPlatformDefaults();

  const [draft, setDraft] = useState<PlatformModelDefaults | undefined>(defaults);
  const [lastServerValue, setLastServerValue] = useState(defaults);

  // Adjusted during render rather than in an effect, so a save never leaves the
  // previous selection on screen for a frame.
  if (defaults !== lastServerValue) {
    setLastServerValue(defaults);
    setDraft(defaults);
  }

  if (isPending || !draft || !defaults) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Platform defaults"
          description="The models a workspace runs until it chooses its own."
        />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const dirty =
    keyOf(draft.chat) !== keyOf(defaults.chat) ||
    keyOf(draft.embedding) !== keyOf(defaults.embedding);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform defaults"
        description="The models a workspace runs until it chooses its own. Changing them moves every workspace that has never opened its model settings."
      />

      <DetailSection
        title="Default models"
        description="Only models that are offered and whose provider holds a key can be chosen here."
        actions={
          <Button
            disabled={!dirty || save.isPending}
            onClick={() => save.mutate(draft)}
          >
            {save.isPending ? "Saving..." : "Save defaults"}
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <DefaultSelect
            id="default-chat"
            label="Chat"
            hint="Economy on purpose: it is what the free plan runs, and the free plan has to work."
            choices={choicesFor(providers, "chat", draft.chat)}
            value={draft.chat}
            onChange={(chat) => setDraft({ ...draft, chat })}
          />
          <DefaultSelect
            id="default-embedding"
            label="Embedding"
            hint="Changing this does not re-embed anything already indexed — old and new vectors would not be comparable."
            choices={choicesFor(providers, "embedding", draft.embedding)}
            value={draft.embedding}
            onChange={(embedding) => setDraft({ ...draft, embedding })}
          />
        </div>
      </DetailSection>
    </div>
  );
}
