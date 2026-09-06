"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CheckCircle2, KeyRound, Loader2, XCircle } from "lucide-react";
import { z } from "zod";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { DetailSection } from "@/components/detail-shell";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/lib/format";
import {
  useCheckProvider,
  useImportProviderModels,
  useRemoveProviderKey,
  useSaveProviderKey,
} from "../hooks/model-providers.hook";
import type { ModelProvider } from "../service/model-providers.service";

const schema = z.object({
  apiKey: z.string().trim().min(8, "That is too short to be a provider key."),
  baseUrl: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^https?:\/\/\S+$/.test(value),
      "Enter a full URL, or leave it blank for the provider's own endpoint.",
    ),
});

type FormValues = z.infer<typeof schema>;

/** The outcome of the last live call, if one has been made. */
function LastCheck({ provider }: { provider: ModelProvider }) {
  const { lastCheckedAt, lastCheckOk, lastCheckError } = provider.credential;
  if (!lastCheckedAt) return null;

  return (
    <p
      className={
        lastCheckOk
          ? "flex items-start gap-2 text-xs text-emerald-600 dark:text-emerald-400"
          : "flex items-start gap-2 text-xs text-destructive"
      }
    >
      {lastCheckOk ? (
        <CheckCircle2 className="mt-px size-3.5 shrink-0" />
      ) : (
        <XCircle className="mt-px size-3.5 shrink-0" />
      )}
      <span>
        {lastCheckOk
          ? `Accepted at ${formatDateTime(lastCheckedAt)}.`
          : `Rejected at ${formatDateTime(lastCheckedAt)} — ${lastCheckError}`}
      </span>
    </p>
  );
}

/**
 * A key is write-only here, on purpose. It is submitted, it is never read back,
 * and what stays on screen is the masked hint — which is also all the API
 * returns for a stored credential.
 *
 * "Test connection" is the only way to know a key works without waiting for a
 * customer to hit it. It makes one cheap authenticated call (a model list, not
 * a generation), so pressing it repeatedly costs nothing.
 */
export function ProviderCredentialForm({
  provider,
}: {
  provider: ModelProvider;
}) {
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);
  const save = useSaveProviderKey(provider.id, provider.name);
  const remove = useRemoveProviderKey(provider.id, provider.name);
  const check = useCheckProvider(provider.id);
  const importModels = useImportProviderModels(provider.id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { apiKey: "", baseUrl: provider.credential.baseUrl ?? "" },
  });

  const { credential } = provider;

  return (
    <DetailSection
      title="API key"
      description={
        credential.configured
          ? "Submitting a new key replaces the stored one. The current value cannot be displayed."
          : `Ragenta pays for inference, so this key is the platform's, not a customer's. Every workspace calling ${provider.name} bills against it.`
      }
      actions={
        credential.configured ? (
          <StatusBadge tone="success">configured</StatusBadge>
        ) : (
          <StatusBadge tone="warning">no key</StatusBadge>
        )
      }
    >
      {credential.configured && (
        <div className="mb-4 space-y-3 rounded-md border bg-muted/40 px-4 py-3 text-sm">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="flex items-center gap-2 font-mono">
              <KeyRound className="size-4 text-muted-foreground" />
              {credential.hint}
            </span>
            <span className="text-xs text-muted-foreground">
              Updated {formatDateTime(credential.updatedAt)}
            </span>
            <div className="ml-auto flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!provider.supported || check.isPending}
                onClick={() => check.mutate()}
              >
                {check.isPending && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Test connection
              </Button>
              {provider.importable && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={importModels.isPending}
                  onClick={() => importModels.mutate()}
                >
                  {importModels.isPending && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  Import models
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmingRemoval(true)}
              >
                Remove key
              </Button>
            </div>
          </div>
          <LastCheck provider={provider} />
        </div>
      )}

      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={handleSubmit((values) =>
          save.mutate(
            { apiKey: values.apiKey, baseUrl: values.baseUrl || null },
            { onSuccess: () => reset({ apiKey: "", baseUrl: values.baseUrl }) },
          ),
        )}
      >
        <div className="grid gap-2">
          <Label htmlFor="provider-key">
            {credential.configured ? "Replacement key" : "API key"}
          </Label>
          <Input
            id="provider-key"
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder={provider.keyHint}
            {...register("apiKey")}
          />
          {errors.apiKey && (
            <p className="text-sm text-destructive">{errors.apiKey.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="provider-base-url">
            Base URL{provider.requiresBaseUrl ? "" : " (optional)"}
          </Label>
          <Input
            id="provider-base-url"
            placeholder={provider.defaultBaseUrl ?? "https://..."}
            autoComplete="off"
            spellCheck={false}
            {...register("baseUrl")}
          />
          <p className="text-xs text-muted-foreground">
            {provider.requiresBaseUrl
              ? "Required — this provider has no default host."
              : "Only for a self-hosted or regional endpoint."}
          </p>
          {errors.baseUrl && (
            <p className="text-sm text-destructive">{errors.baseUrl.message}</p>
          )}
        </div>

        <div className="flex justify-end sm:col-span-2">
          <Button type="submit" disabled={save.isPending}>
            {save.isPending
              ? "Saving..."
              : credential.configured
                ? "Replace key"
                : "Save key"}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmingRemoval}
        onOpenChange={setConfirmingRemoval}
        title={`Remove the ${provider.name} key?`}
        description={`Every ${provider.name} model stops being selectable, and any workspace whose default points at one will fail its next request until it picks something else.`}
        confirmLabel="Remove key"
        destructive
        pending={remove.isPending}
        onConfirm={() =>
          remove.mutate(undefined, {
            onSuccess: () => setConfirmingRemoval(false),
          })
        }
      />
    </DetailSection>
  );
}
