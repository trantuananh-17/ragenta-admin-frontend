"use client";

import { useState } from "react";
import { AlertCircle, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { StatusBadge } from "@/components/status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  useCheckSpeechEndpoint,
  useClearSpeechEndpoint,
  useSaveSpeechEndpoint,
} from "../hooks/speech.hook";
import type { SpeechCapability, SpeechEndpoint } from "../service/speech.service";

/**
 * A starting point, not a default.
 *
 * There is no host that is right for both halves of every deployment, so nothing
 * is prefilled on save. But an empty form gives an administrator no idea what
 * shape a correct answer has, and the two shapes that matter are a gateway and a
 * self-hosted container.
 */
const EXAMPLES: Record<
  SpeechCapability,
  { baseUrl: string; model: string; voice?: string }[]
> = {
  stt: [
    { baseUrl: "https://openrouter.ai/api/v1", model: "openai/whisper-large-v3" },
    { baseUrl: "https://api.openai.com/v1", model: "whisper-1" },
    { baseUrl: "http://speaches:8000/v1", model: "Systran/faster-whisper-large-v3" },
  ],
  tts: [
    {
      baseUrl: "https://openrouter.ai/api/v1",
      model: "google/gemini-3.1-flash-tts-preview",
      voice: "alloy",
    },
    { baseUrl: "https://api.openai.com/v1", model: "tts-1", voice: "alloy" },
  ],
};

export function SpeechEndpointCard({
  capability,
  title,
  description,
  endpoint,
  encryptionConfigured,
}: {
  capability: SpeechCapability;
  title: string;
  description: string;
  endpoint: SpeechEndpoint;
  encryptionConfigured: boolean;
}) {
  const save = useSaveSpeechEndpoint();
  const clear = useClearSpeechEndpoint();
  const check = useCheckSpeechEndpoint();
  const [confirming, setConfirming] = useState(false);

  const [baseUrl, setBaseUrl] = useState(endpoint.baseUrl ?? "");
  const [model, setModel] = useState(endpoint.model ?? "");
  const [voice, setVoice] = useState(endpoint.voice ?? "");
  const [apiKey, setApiKey] = useState("");

  const needsVoice = capability === "tts";
  const fromEnvironment = endpoint.source === "environment";
  /*
    A key is demanded the first time only. After that, leaving it blank keeps the
    stored one: the console cannot show a key back, so requiring it on every edit
    would mean re-pasting a secret in order to rename a model.
  */
  const keyRequired = endpoint.source !== "database";
  const pending = save.isPending || clear.isPending;

  const complete =
    baseUrl.trim().length > 0 &&
    model.trim().length > 0 &&
    (!needsVoice || voice.trim().length > 0) &&
    (!keyRequired || apiKey.trim().length >= 8);

  return (
    <div className="space-y-4 rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {endpoint.configured ? (
          <StatusBadge tone={fromEnvironment ? "info" : "success"}>
            {fromEnvironment ? "from environment" : "configured here"}
          </StatusBadge>
        ) : (
          <StatusBadge tone="neutral">off</StatusBadge>
        )}
      </div>

      {fromEnvironment && (
        <p className="rounded-md bg-muted/60 p-2.5 text-xs text-muted-foreground">
          This is coming from the environment file on the server. Saving here
          replaces it; clearing gives it back.
        </p>
      )}

      {!encryptionConfigured && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>
            This deployment has no <code>SECRETS_ENCRYPTION_KEY</code>, so no key
            can be stored. Writing one in the clear is not a fallback.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs">Base URL</Label>
          <Input
            value={baseUrl}
            disabled={pending}
            placeholder={EXAMPLES[capability][0].baseUrl}
            onChange={(event) => setBaseUrl(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Model</Label>
          <Input
            value={model}
            disabled={pending}
            placeholder={EXAMPLES[capability][0].model}
            onChange={(event) => setModel(event.target.value)}
          />
        </div>

        {needsVoice && (
          <div className="space-y-1.5">
            <Label className="text-xs">Voice</Label>
            <Input
              value={voice}
              disabled={pending}
              placeholder="alloy"
              onChange={(event) => setVoice(event.target.value)}
            />
          </div>
        )}

        <div className={needsVoice ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
          <Label className="text-xs">
            API key
            {!keyRequired && (
              <span className="ml-1.5 font-normal text-muted-foreground">
                stored {endpoint.keyHint} — leave blank to keep it
              </span>
            )}
          </Label>
          <Input
            type="password"
            autoComplete="off"
            value={apiKey}
            disabled={pending || !encryptionConfigured}
            placeholder={keyRequired ? "Required" : "Leave blank to keep the stored key"}
            onChange={(event) => setApiKey(event.target.value)}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Any host speaking the OpenAI audio API works here, so one form covers a
        gateway and a self-hosted container alike. For example:{" "}
        {EXAMPLES[capability]
          .map((example) => example.baseUrl + " (" + example.model + ")")
          .join(", ")}
        .
      </p>

      <Separator />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          disabled={!complete || pending || !encryptionConfigured}
          onClick={() =>
            save.mutate({
              capability,
              values: {
                baseUrl: baseUrl.trim(),
                model: model.trim(),
                ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
                voice: needsVoice ? voice.trim() : null,
              },
            })
          }
        >
          {save.isPending ? "Saving…" : "Save"}
        </Button>

        <Button
          size="sm"
          variant="outline"
          disabled={!endpoint.configured || check.isPending}
          onClick={() => check.mutate(capability)}
        >
          {check.isPending ? "Checking…" : "Test connection"}
        </Button>

        {endpoint.source === "database" && (
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => setConfirming(true)}
          >
            <Trash2 className="size-3.5" />
            Clear
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={"Clear " + title.toLowerCase() + "?"}
        description="The stored key is deleted. This deployment falls back to whatever its environment configures, which for most is nothing — so this is also how you switch the feature off."
        confirmLabel="Clear"
        onConfirm={() => {
          clear.mutate(capability);
          setConfirming(false);
        }}
      />
    </div>
  );
}
