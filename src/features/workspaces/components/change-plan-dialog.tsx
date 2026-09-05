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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSetWorkspacePlan } from "@/features/workspaces/hooks/workspaces.hook";
import { PLAN_NAMES } from "./plan-badge";

/**
 * Changes the plan without going near the payment provider — the escape hatch
 * for an enterprise deal invoiced by hand, and for putting a workspace back
 * where it belongs after a failed charge.
 */
export function ChangePlanDialog({
  workspaceId,
  workspaceName,
  currentPlan,
  open,
  onOpenChange,
}: {
  workspaceId: string;
  workspaceName: string;
  currentPlan: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const setPlan = useSetWorkspacePlan(workspaceId);
  const [plan, setSelectedPlan] = useState(currentPlan);
  const [wasOpen, setWasOpen] = useState(open);

  // Reopening starts from what the workspace is on now, not from whatever was
  // half-selected last time. Adjusted during render rather than in an effect, so
  // the dialog never paints the stale selection first.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setSelectedPlan(currentPlan);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change plan</DialogTitle>
          <DialogDescription>
            {workspaceName} is on <strong>{currentPlan}</strong>. Changing it here
            does not touch the payment provider — the subscription and the invoice
            stay as they are.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <Label htmlFor="plan">New plan</Label>
          <Select value={plan} onValueChange={setSelectedPlan}>
            <SelectTrigger id="plan">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLAN_NAMES.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={setPlan.isPending}
          >
            Cancel
          </Button>
          <Button
            disabled={setPlan.isPending || plan === currentPlan}
            onClick={() =>
              setPlan.mutate(plan, { onSuccess: () => onOpenChange(false) })
            }
          >
            {setPlan.isPending ? "Changing..." : "Change plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
