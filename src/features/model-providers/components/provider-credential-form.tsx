"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { KeyRound } from "lucide-react";
import { z } from "zod";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { DetailSection } from "@/components/detail-shell";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/lib/format";
import {
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

/**
 * A key is write-only here, on purpose. It is submitted, it is never read back,
 * and what stays on screen is the masked hint — which is also all an API should
 * ever return for a stored credential.
 */
export function ProviderCredentialForm({
  provider,
}: {
  provider: ModelProvider;
}) {
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);
  const save = useSaveProviderKey(provider.id);
  const remove = useRemoveProviderKey(provider.id);

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
        <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-md border bg-muted/40 px-4 py-3 text-sm">
          <span className="flex items-center gap-2 font-mono">
            <KeyRound className="size-4 text-muted-foreground" />
            {credential.hint}
          </span>
          <span className="text-xs text-muted-foreground">
            Updated {formatDateTime(credential.updatedAt)}
            {credential.updatedBy ? ` by ${credential.updatedBy}` : ""}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => setConfirmingRemoval(true)}
          >
            Remove key
          </Button>
        </div>
      )}

      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={handleSubmit((values) =>
          save.mutate(
            { apiKey: values.apiKey, baseUrl: values.baseUrl || null },
            {
              onSuccess: () =>
                reset({ apiKey: "", baseUrl: values.baseUrl }),
            },
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
            placeholder="Paste the key"
            {...register("apiKey")}
          />
          {errors.apiKey && (
            <p className="text-sm text-destructive">{errors.apiKey.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="provider-base-url">Base URL</Label>
          <Input
            id="provider-base-url"
            placeholder="Provider default"
            autoComplete="off"
            spellCheck={false}
            {...register("baseUrl")}
          />
          <p className="text-xs text-muted-foreground">
            Only for a self-hosted or regional endpoint.
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
