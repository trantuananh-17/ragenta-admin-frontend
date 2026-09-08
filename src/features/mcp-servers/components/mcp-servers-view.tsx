"use client";

import { useState } from "react";
import { AlertCircle, Loader2, Plus, RefreshCw, Server, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { CopyButton } from "@/components/copy-button";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/format";
import {
  useCheckMcpServer,
  useDeleteMcpServer,
  useMcpServersSuspense,
  useSaveMcpServer,
} from "../hooks/mcp-servers.hook";
import { toolId, type McpServer } from "../service/mcp-servers.service";

/**
 * MCP servers every workspace on this deployment can reach.
 *
 * Platform-wide, as against the ones a workspace configures for itself: adding
 * one here hands its tools to every agent in every workspace, so the screen
 * treats the **allowlist as a decision** rather than an advanced setting. An
 * empty allowlist accepts whatever the server advertises — including a tool it
 * starts advertising next month, which nobody approved and which an agent will
 * happily call.
 */
export function McpServersView() {
  const { data: servers } = useMcpServersSuspense();
  const [editing, setEditing] = useState<McpServer | "new" | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<McpServer | null>(null);

  const check = useCheckMcpServer();
  const remove = useDeleteMcpServer();

  return (
    <>
      <PageHeader
        title="MCP servers"
        description="Tool servers every workspace's agents can reach, over the Model Context Protocol."
        info="Ragenta speaks MCP over HTTP without a session, so a server that requires an initialised session will not work. A tool arrives as mcp:<slug>:<tool> and an agent version names it like any other tool."
        actions={
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="size-4" />
            Add a server
          </Button>
        }
      />

      {servers.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed p-10 text-center">
          <Server className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-2 font-medium">No MCP server is configured</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Agents can still use the built-in tools. A workspace can also add its
            own server without one being here.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {servers.map((server) => (
            <ServerCard
              key={server.id}
              server={server}
              checking={check.isPending}
              onCheck={() => check.mutate(server.id)}
              onEdit={() => setEditing(server)}
              onRemove={() => setPendingRemoval(server)}
            />
          ))}
        </div>
      )}

      {editing && (
        <div className="mt-6">
          <ServerForm
            key={editing === "new" ? "new" : editing.id}
            server={editing === "new" ? undefined : editing}
            onDone={() => setEditing(null)}
          />
        </div>
      )}

      <ConfirmDialog
        open={pendingRemoval !== null}
        onOpenChange={(open) => !open && setPendingRemoval(null)}
        title={`Remove ${pendingRemoval?.name ?? ""}?`}
        description="Every agent version that names one of its tools keeps the name and starts failing on it. Check what is using it before removing it."
        confirmLabel="Remove"
        destructive
        pending={remove.isPending}
        onConfirm={() => {
          if (!pendingRemoval) return;
          remove.mutate(pendingRemoval.id, {
            onSuccess: () => setPendingRemoval(null),
          });
        }}
      />
    </>
  );
}

function ServerCard({
  server,
  checking,
  onCheck,
  onEdit,
  onRemove,
}: {
  server: McpServer;
  checking: boolean;
  onCheck: () => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const offered = server.tools.filter(
    (tool) => server.allowedTools.length === 0 || server.allowedTools.includes(tool.name),
  );

  return (
    <section className="rounded-lg border bg-background">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <h2 className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            {server.name}
            <code className="font-mono text-xs text-muted-foreground">
              {server.slug}
            </code>
            {server.enabled ? (
              <StatusBadge tone="success">on</StatusBadge>
            ) : (
              <StatusBadge tone="neutral">off</StatusBadge>
            )}
            {server.lastCheckOk === false && (
              <StatusBadge tone="danger">unreachable</StatusBadge>
            )}
            {server.allowedTools.length === 0 && server.tools.length > 0 && (
              <StatusBadge tone="warning">every tool allowed</StatusBadge>
            )}
          </h2>
          {server.description && (
            <p className="mt-1 text-xs text-muted-foreground">{server.description}</p>
          )}
          <p className="mt-1 font-mono text-xs text-muted-foreground">{server.url}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {server.secretHint
              ? `Sends ${server.authHeader}: …${server.secretHint}`
              : "No credential sent."}
            {server.lastCheckedAt &&
              ` · checked ${formatDateTime(server.lastCheckedAt)}`}
          </p>
          {server.lastCheckError && (
            <p className="mt-1 max-w-2xl text-xs text-destructive">
              {server.lastCheckError}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={checking} onClick={onCheck}>
            <RefreshCw className="size-4" />
            Check
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit}>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Remove ${server.name}`}
            onClick={onRemove}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </header>

      <div className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Tools it offers
        </p>

        {server.tools.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Not asked yet. Press Check to read its tool list — an agent can only
            name a tool that has been discovered.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {server.tools.map((tool) => {
              const allowed =
                server.allowedTools.length === 0 ||
                server.allowedTools.includes(tool.name);
              return (
                <li key={tool.name} className="flex flex-wrap items-start gap-2">
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                    {toolId(server.slug, tool.name)}
                  </code>
                  <CopyButton value={toolId(server.slug, tool.name)} />
                  {!allowed && <StatusBadge tone="neutral">blocked</StatusBadge>}
                  <span className="min-w-0 flex-1 text-xs text-muted-foreground">
                    {tool.description}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {server.tools.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            {offered.length} of {server.tools.length} reachable by an agent.
            {server.toolsCachedAt &&
              ` This list was read ${formatDateTime(server.toolsCachedAt)} — a server that has changed since then will fail on a tool that is no longer there.`}
          </p>
        )}
      </div>
    </section>
  );
}

function ServerForm({ server, onDone }: { server?: McpServer; onDone: () => void }) {
  const save = useSaveMcpServer();

  const [slug, setSlug] = useState(server?.slug ?? "");
  const [name, setName] = useState(server?.name ?? "");
  const [description, setDescription] = useState(server?.description ?? "");
  const [url, setUrl] = useState(server?.url ?? "");
  const [enabled, setEnabled] = useState(server?.enabled ?? true);
  const [secret, setSecret] = useState("");
  const [clearSecret, setClearSecret] = useState(false);
  const [authHeader, setAuthHeader] = useState(server?.authHeader ?? "Authorization");
  const [authPrefix, setAuthPrefix] = useState("Bearer ");
  /** Empty means every tool, which is the state the warning below is about. */
  const [allowedTools, setAllowedTools] = useState<string[]>(server?.allowedTools ?? []);

  const ready = slug.trim().length >= 2 && name.trim() && url.trim().startsWith("http");

  return (
    <section className="rounded-lg border bg-background">
      <header className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">
          {server ? `Edit ${server.name}` : "Add an MCP server"}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          The slug is matched on save, so keeping it edits this server and changing
          it creates another.
        </p>
      </header>

      <div className="space-y-4 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="mcp-slug">Slug</Label>
            <Input
              id="mcp-slug"
              value={slug}
              placeholder="acme-docs"
              disabled={Boolean(server)}
              onChange={(event) => setSlug(event.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Part of the tool name the model sees, so lower-case letters, digits
              and dashes only.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mcp-name">Name</Label>
            <Input
              id="mcp-name"
              value={name}
              placeholder="Acme documentation"
              onChange={(event) => setName(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mcp-url">URL</Label>
          <Input
            id="mcp-url"
            value={url}
            placeholder="https://mcp.example.com/rpc"
            onChange={(event) => setUrl(event.target.value)}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            http is accepted for a server on this deployment&apos;s own network.
            What makes that safe is the fetch guard, which refuses private and
            link-local addresses on every hop — not the scheme.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mcp-description">Description</Label>
          <Textarea
            id="mcp-description"
            rows={2}
            value={description}
            placeholder="What this server is for. Administrators read it, not the model."
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="mcp-secret">Credential</Label>
            <Input
              id="mcp-secret"
              type="password"
              value={secret}
              disabled={clearSecret}
              placeholder={
                server?.secretHint ? "Stored — leave blank to keep it" : "None"
              }
              onChange={(event) => setSecret(event.target.value)}
              className="font-mono text-xs"
            />
            {server?.secretHint && (
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={clearSecret}
                  onCheckedChange={(checked) => setClearSecret(checked === true)}
                />
                Remove the stored credential
              </label>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mcp-auth-header">Header</Label>
            <Input
              id="mcp-auth-header"
              value={authHeader}
              onChange={(event) => setAuthHeader(event.target.value)}
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mcp-auth-prefix">Prefix</Label>
            <Input
              id="mcp-auth-prefix"
              value={authPrefix}
              onChange={(event) => setAuthPrefix(event.target.value)}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Sent as <code className="font-mono">{authHeader}: {authPrefix}…</code>
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mcp-allowed">Tools an agent may call</Label>
          <Input
            id="mcp-allowed"
            value={allowedTools.join(", ")}
            placeholder="Leave empty to allow every tool"
            onChange={(event) =>
              setAllowedTools(
                event.target.value
                  .split(",")
                  .map((entry) => entry.trim())
                  .filter(Boolean),
              )
            }
            className="font-mono text-xs"
          />
          {allowedTools.length === 0 ? (
            <p className="rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
              Empty means every tool this server advertises — including one it
              starts advertising later. A server approved for{" "}
              <code className="font-mono">search_docs</code> that adds{" "}
              <code className="font-mono">delete_everything</code> would gain that
              reach with nobody deciding anything. Name the tools unless you control
              the server.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Comma separated, by the server&apos;s own tool names. Anything else it
              offers is refused.
            </p>
          )}
          {server && server.tools.length > 0 && allowedTools.length === 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAllowedTools(server.tools.map((tool) => tool.name))}
            >
              Allow only the {server.tools.length} it offers today
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={enabled} onCheckedChange={setEnabled} aria-label="Enabled" />
            <span className="text-muted-foreground">
              {enabled ? "Agents may reach it" : "Off — its tools are not offered"}
            </span>
          </label>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onDone}>
              Cancel
            </Button>
            <Button
              disabled={!ready || save.isPending}
              onClick={() =>
                save.mutate(
                  {
                    slug: slug.trim(),
                    name: name.trim(),
                    description: description.trim(),
                    url: url.trim(),
                    enabled,
                    authHeader: authHeader.trim() || "Authorization",
                    authPrefix,
                    allowedTools,
                    // Absent keeps what is stored; null clears it. An empty
                    // string would be neither, so it is never sent.
                    ...(clearSecret
                      ? { secret: null }
                      : secret.trim()
                        ? { secret: secret.trim() }
                        : {}),
                  },
                  { onSuccess: onDone },
                )
              }
            >
              {save.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function McpServersLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-56" />
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading MCP servers...
      </p>
    </div>
  );
}

export function McpServersError() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md border p-10 text-center">
      <AlertCircle className="size-8 text-destructive" />
      <p className="font-medium">Could not load MCP servers</p>
      <p className="max-w-md text-sm text-muted-foreground">
        The platform admin API refused or is unreachable. This screen needs the{" "}
        <code className="font-mono text-xs">admin.mcp.read</code> permission.
      </p>
    </div>
  );
}
