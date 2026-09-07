"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useSaveIntegration } from "../hooks/integrations.hook";
import {
  HTTP_METHODS,
  type Integration,
  type IntegrationKind,
} from "../service/integrations.service";

interface FormState {
  id: string;
  kind: IntegrationKind;
  name: string;
  description: string;
  enabled: boolean;
  baseUrl: string;
  secret: string;
  authHeader: string;
  authPrefix: string;
  allowedMethods: string[];
  allowedPathPrefix: string;
  allowedRecipients: string;
}

const BLANK: FormState = {
  id: "",
  kind: "http_api",
  name: "",
  description: "",
  enabled: true,
  baseUrl: "",
  secret: "",
  authHeader: "Authorization",
  authPrefix: "Bearer ",
  allowedMethods: ["GET"],
  allowedPathPrefix: "",
  allowedRecipients: "",
};

/**
 * Create or edit one connection.
 *
 * The key field is always blank, even when editing, and says so: it cannot be
 * read back, so showing an empty box that means "unchanged" is the only honest
 * thing it can show. Leaving it blank keeps the stored key, which is what makes
 * editing an allowlist something other than a key rotation.
 */
function initialState(integration: Integration | null): FormState {
  if (!integration) return BLANK;
  return {
    id: integration.id,
    kind: integration.kind as IntegrationKind,
    name: integration.name,
    description: integration.description ?? "",
    enabled: integration.enabled,
    baseUrl: integration.baseUrl ?? "",
    secret: "",
    authHeader: integration.authHeader ?? "",
    authPrefix: integration.authPrefix,
    allowedMethods: integration.allowedMethods,
    allowedPathPrefix: integration.allowedPathPrefix,
    allowedRecipients: integration.allowedRecipients.join("\n"),
  };
}

/**
 * The dialog exists to give the form a `key`.
 *
 * Resetting the fields when a different connection is opened is a **remount**,
 * not an effect that copies props into state. That pattern causes a cascading
 * render, and replacing it with a key is exactly what React's own guidance says
 * to do — the lint rule that rejects it is right.
 */
export function IntegrationDialog({
  open,
  integration,
  onOpenChange,
}: {
  open: boolean;
  integration: Integration | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <IntegrationForm
          key={integration?.id ?? "new"}
          integration={integration}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
}

function IntegrationForm({
  integration,
  onOpenChange,
}: {
  integration: Integration | null;
  onOpenChange: (open: boolean) => void;
}) {
  const save = useSaveIntegration();
  const [form, setForm] = useState<FormState>(() => initialState(integration));

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const editing = integration !== null;
  // `tavily` and `email` are the ids the tools look up by name, so the tool
  // cannot find a connection filed under anything else.
  const fixedId =
    form.kind === "web_search"
      ? "tavily"
      : form.kind === "email"
        ? "email"
        : null;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const id = fixedId ?? form.id.trim();
    if (!id || !form.name.trim()) return;

    save.mutate(
      {
        id,
        values: {
          kind: form.kind,
          name: form.name.trim(),
          description: form.description.trim() || null,
          enabled: form.enabled,
          baseUrl: form.baseUrl.trim() || null,
          ...(form.secret.trim() ? { secret: form.secret.trim() } : {}),
          authHeader: form.authHeader.trim() || null,
          authPrefix: form.authPrefix,
          allowedMethods: form.allowedMethods,
          allowedPathPrefix: form.allowedPathPrefix.trim(),
          allowedRecipients: form.allowedRecipients
            .split(/[\n,]/)
            .map((entry) => entry.trim())
            .filter(Boolean),
        },
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <form onSubmit={submit}>
      <DialogHeader>
        <DialogTitle>
          {editing ? "Edit connection" : "New connection"}
        </DialogTitle>
        <DialogDescription>
          What an agent may reach through this, and what it may do there.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Kind</Label>
          <Select
            value={form.kind}
            disabled={editing}
            onValueChange={(next) => set("kind", next as IntegrationKind)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="http_api">
                API connection — api_call
              </SelectItem>
              <SelectItem value="web_search">
                Web search — web_search
              </SelectItem>
              <SelectItem value="email">Email — send_email</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {fixedId ? (
          <p className="text-xs text-muted-foreground">
            Filed as <code>{fixedId}</code>, which is the id its tool looks up.
          </p>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="integration-id">Id</Label>
            <Input
              id="integration-id"
              disabled={editing}
              placeholder="crm"
              value={form.id}
              onChange={(event) => set("id", event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              What an agent names when it calls this. Cannot be changed later.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="integration-name">Name</Label>
          <Input
            id="integration-name"
            value={form.name}
            onChange={(event) => set("name", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="integration-description">Description</Label>
          <Textarea
            id="integration-description"
            rows={2}
            value={form.description}
            onChange={(event) => set("description", event.target.value)}
          />
        </div>

        {form.kind !== "email" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="integration-base">Base URL</Label>
              <Input
                id="integration-base"
                placeholder="https://api.example.com"
                value={form.baseUrl}
                onChange={(event) => set("baseUrl", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="integration-secret">
                API key {editing && "(leave blank to keep the stored one)"}
              </Label>
              <Input
                id="integration-secret"
                type="password"
                autoComplete="off"
                placeholder={
                  integration?.hasSecret
                    ? (integration.secretHint ?? "stored")
                    : ""
                }
                value={form.secret}
                onChange={(event) => set("secret", event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Encrypted at rest and never returned by the API — not to this
                screen and not to an agent.
              </p>
            </div>
          </>
        )}

        {form.kind === "http_api" && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="integration-header">Auth header</Label>
                <Input
                  id="integration-header"
                  placeholder="Authorization"
                  value={form.authHeader}
                  onChange={(event) => set("authHeader", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="integration-prefix">Prefix</Label>
                <Input
                  id="integration-prefix"
                  placeholder="Bearer "
                  value={form.authPrefix}
                  onChange={(event) => set("authPrefix", event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Methods an agent may use</Label>
              <div className="flex flex-wrap gap-2 rounded-md border p-2">
                {HTTP_METHODS.map((method) => (
                  <label
                    key={method}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={form.allowedMethods.includes(method)}
                      onChange={(event) =>
                        set(
                          "allowedMethods",
                          event.target.checked
                            ? [...form.allowedMethods, method]
                            : form.allowedMethods.filter(
                                (entry) => entry !== method,
                              ),
                        )
                      }
                    />
                    {method}
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                A connection with only GET stays read-only however the agent is
                talked to.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="integration-path">Path prefix</Label>
              <Input
                id="integration-path"
                placeholder="/v1/contacts"
                value={form.allowedPathPrefix}
                onChange={(event) =>
                  set("allowedPathPrefix", event.target.value)
                }
              />
              <p className="text-xs text-muted-foreground">
                Every call must start with this. Blank allows the whole host.
              </p>
            </div>
          </>
        )}

        {form.kind === "email" && (
          <div className="space-y-2">
            <Label htmlFor="integration-recipients">Allowed recipients</Label>
            <Textarea
              id="integration-recipients"
              rows={4}
              placeholder={"ops@yourcompany.com\n*@yourcompany.com"}
              value={form.allowedRecipients}
              onChange={(event) => set("allowedRecipients", event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              One per line. <code>*@domain</code> allows a whole domain; a bare{" "}
              <code>*</code> is refused. An empty list means every send is
              refused, which is the right default for a scope nobody has
              decided.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
          <div className="space-y-0.5">
            <Label htmlFor="integration-enabled">Enabled</Label>
            <p className="text-xs text-muted-foreground">
              Off keeps the row and its key while refusing every call through
              it.
            </p>
          </div>
          <Switch
            id="integration-enabled"
            checked={form.enabled}
            onCheckedChange={(checked) => set("enabled", checked)}
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={save.isPending || !form.name.trim()}>
          {save.isPending ? "Saving…" : "Save connection"}
        </Button>
      </DialogFooter>
    </form>
  );
}
