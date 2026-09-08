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
import { Textarea } from "@/components/ui/textarea";
import { useCreateRole } from "../hooks/roles.hook";

/**
 * A new role starts empty, and its permissions are chosen afterwards in the
 * matrix. Two steps rather than one long form because the catalogue is nearly
 * eighty entries — a dialog that asked for all of it at once would be scrolled
 * past rather than read.
 */
export function NewRoleDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (roleId: string) => void;
}) {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState<"workspace" | "platform">("workspace");

  const create = useCreateRole();

  function reset() {
    setName("");
    setKey("");
    setDescription("");
    setScope("workspace");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New role</DialogTitle>
          <DialogDescription>
            A workspace role is assigned to members; a platform role is assigned to console
            accounts. The scope cannot be changed afterwards, because the permissions it may hold
            depend on it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role-name">Name</Label>
            <Input
              id="role-name"
              value={name}
              placeholder="Content editor"
              onChange={(event) => {
                setName(event.target.value);
                // The key follows the name until somebody types their own, which
                // is what makes it a slug rather than a second thing to invent.
                if (!key || key === slugify(name)) setKey(slugify(event.target.value));
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-key">Key</Label>
            <Input
              id="role-key"
              value={key}
              placeholder="content-editor"
              onChange={(event) => setKey(event.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Lower-case letters, digits and dashes. It appears in URLs and never changes.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-scope">Scope</Label>
            <Select value={scope} onValueChange={(value) => setScope(value as typeof scope)}>
              <SelectTrigger id="role-scope">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="workspace">Workspace</SelectItem>
                <SelectItem value="platform">Platform (admin console)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-description">Description</Label>
            <Textarea
              id="role-description"
              value={description}
              placeholder="What this role is for, in one line."
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={name.trim().length < 2 || key.trim().length < 2 || create.isPending}
            onClick={() =>
              create.mutate(
                { key: key.trim(), name: name.trim(), description: description.trim(), scope, permissions: [] },
                {
                  onSuccess: (role) => {
                    reset();
                    onOpenChange(false);
                    onCreated(role.id);
                  },
                },
              )
            }
          >
            {create.isPending ? "Creating..." : "Create role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
