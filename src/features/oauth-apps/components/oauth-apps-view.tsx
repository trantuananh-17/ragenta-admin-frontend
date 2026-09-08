"use client";

import { useState } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";

import { CopyButton } from "@/components/copy-button";
import { DetailShell } from "@/components/detail-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useOAuthProvidersSuspense, useSaveOAuthClient } from "../hooks/oauth-apps.hook";
import type { OAuthProvider } from "../service/oauth-apps.service";

/**
 * Where Ragenta's own OAuth apps are registered.
 *
 * Until one is here, every Gmail, Drive, Calendar, Sheets, Slack, GitHub and
 * Notion tool refuses — a workspace cannot connect an account without a client
 * id to authorise against. That is said on the page, because "my agent says
 * Google is not configured" is otherwise a support ticket rather than a sentence
 * somebody reads and acts on.
 */
export function OAuthAppsView() {
  const { data: providers } = useOAuthProvidersSuspense();
  const unconfigured = providers.filter((provider) => !provider.configured).length;

  return (
    <DetailShell>
      <PageHeader
        title="Connected apps"
        description="The OAuth apps this deployment authorises with. A workspace can only connect a Google or Slack account once the matching app is registered here."
        info="Ragenta registers one app per provider and every workspace authorises against it. Register the redirect URI shown on each card with the provider, or the authorisation will be refused before anybody sees a consent screen."
      />

      {unconfigured > 0 && (
        <p className="mt-4 rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
          {unconfigured === providers.length
            ? "No provider is registered, so every Gmail, Drive, Calendar, Sheets, Slack, GitHub and Notion tool currently refuses."
            : `${unconfigured} of ${providers.length} providers are not registered. Their tools refuse until they are.`}
        </p>
      )}

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {providers.map((provider) => (
          // Remounting reseeds the form after a save, which is React's own way of
          // resetting state on a prop change — copying the fields in from an
          // effect renders the previous answer first. The key carries everything
          // the form seeds from: keyed on `configured` alone, a save that stored a
          // client id with the switch left off changed nothing the key could see,
          // so the card kept rendering the empty form it had.
          <ProviderCard
            key={`${provider.id}-${provider.clientId}-${String(provider.enabled)}-${String(provider.hasSecret)}`}
            provider={provider}
          />
        ))}
      </div>
    </DetailShell>
  );
}

function ProviderCard({ provider }: { provider: OAuthProvider }) {
  const [clientId, setClientId] = useState(provider.clientId);
  const [clientSecret, setClientSecret] = useState("");
  const [enabled, setEnabled] = useState(provider.enabled);

  const save = useSaveOAuthClient();

  return (
    <section className="rounded-lg border bg-background">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            {provider.name}
            <RegistrationBadge provider={provider} />
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {provider.scopes.length > 0
              ? `Asks for ${provider.scopes.length} ${provider.scopes.length === 1 ? "permission" : "permissions"}.`
              : "Asks for whatever the provider grants by default."}
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} aria-label={`Enable ${provider.name}`} />
      </header>

      <div className="space-y-4 p-4">
        <div className="space-y-1">
          <Label className="text-xs">Redirect URI to register with {provider.name}</Label>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded bg-muted px-2 py-1.5 font-mono text-xs">
              {provider.redirectUri}
            </code>
            <CopyButton value={provider.redirectUri} />
          </div>
          <p className="text-xs text-muted-foreground">
            It must match exactly, including the scheme. A mismatch is refused by the provider
            before a consent screen appears, which looks like nothing happening.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${provider.id}-client-id`}>Client ID</Label>
          <Input
            id={`${provider.id}-client-id`}
            value={clientId}
            placeholder="The client id from the provider's console"
            onChange={(event) => setClientId(event.target.value)}
            className="font-mono text-xs"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${provider.id}-client-secret`}>Client secret</Label>
          <Input
            id={`${provider.id}-client-secret`}
            type="password"
            value={clientSecret}
            placeholder={provider.hasSecret ? "Stored — leave blank to keep it" : ""}
            onChange={(event) => setClientSecret(event.target.value)}
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">
            Encrypted at rest and never shown again. Leaving it blank keeps the one already
            stored.
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            size="sm"
            disabled={
              save.isPending || !clientId.trim() || (!provider.hasSecret && !clientSecret.trim())
            }
            onClick={() =>
              save.mutate({
                provider: provider.id,
                input: {
                  clientId: clientId.trim() || "",
                  // Absent rather than empty: the backend tells them apart, and
                  // sending an empty string would clear a stored secret.
                  ...(clientSecret.trim() ? { clientSecret: clientSecret.trim() } : {}),
                  enabled,
                },
              })
            }
          >
            {save.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </section>
  );
}

/**
 * What state this provider is actually in.
 *
 * Three facts, not one. "Registered but switched off" is a real state somebody
 * lands in by saving with the toggle where it was, and calling it "not
 * registered" sent them back to retype a client id that was already stored.
 */
function RegistrationBadge({ provider }: { provider: OAuthProvider }) {
  if (provider.configured) {
    return (
      <StatusBadge tone="success">
        <Check className="mr-1 size-3" />
        registered
      </StatusBadge>
    );
  }
  if (provider.registered) return <StatusBadge tone="warning">registered, switched off</StatusBadge>;
  if (provider.clientId) return <StatusBadge tone="warning">client secret missing</StatusBadge>;
  return <StatusBadge tone="warning">not registered</StatusBadge>;
}

export function OAuthAppsLoading() {
  return (
    <DetailShell>
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 xl:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading connected apps...
        </p>
      </div>
    </DetailShell>
  );
}

export function OAuthAppsError() {
  return (
    <DetailShell>
      <div className="flex flex-col items-center gap-2 rounded-md border p-10 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <p className="font-medium">Could not load connected apps</p>
        <p className="max-w-md text-sm text-muted-foreground">
          The platform admin API refused or is unreachable. This screen needs the{" "}
          <code className="font-mono text-xs">admin.oauth.read</code> permission.
        </p>
      </div>
    </DetailShell>
  );
}
