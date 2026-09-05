"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import { useAdjustCredits } from "@/features/workspaces/hooks/workspaces.hook";
import { formatCredits } from "@/lib/format";

const schema = z.object({
  amount: z
    .number({ message: "Enter a whole number of credits." })
    .int("Credits are whole numbers.")
    .refine((value) => value !== 0, "Zero moves nothing — enter a real amount."),
  bucket: z.enum(["topup", "plan"]),
  reason: z
    .string()
    .trim()
    .min(3, "Say why. This is written to the audit log.")
    .max(280),
});

type FormValues = z.infer<typeof schema>;

/**
 * Manual credit movement. Positive grants, negative claws back — both go through
 * the normal ledger paths on the backend, so an adjustment reconciles like any
 * other movement.
 *
 * The idempotency key is generated once per open dialog rather than per submit:
 * a double-click, or a retry after a timeout, must not move credit twice.
 */
export function AdjustCreditsDialog({
  workspaceId,
  workspaceName,
  open,
  onOpenChange,
}: {
  workspaceId: string;
  workspaceName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const adjust = useAdjustCredits(workspaceId);
  const [idempotencyKey, setIdempotencyKey] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: 0, bucket: "topup", reason: "" },
  });

  const [wasOpen, setWasOpen] = useState(open);

  // A fresh key and a cleared form each time the dialog opens, adjusted during
  // render rather than in an effect so the previous adjustment is never briefly
  // on screen.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setIdempotencyKey(crypto.randomUUID());
      reset({ amount: 0, bucket: "topup", reason: "" });
    }
  }

  const amount = watch("amount");
  const bucket = watch("bucket");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust credits</DialogTitle>
          <DialogDescription>
            Moves credit in {workspaceName} and writes a matching ledger row and
            audit entry.
          </DialogDescription>
        </DialogHeader>

        <form
          id="adjust-credits"
          onSubmit={handleSubmit((values) =>
            adjust.mutate(
              { ...values, idempotencyKey },
              { onSuccess: () => onOpenChange(false) },
            ),
          )}
          className="grid gap-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step={1}
              placeholder="1000000"
              {...register("amount", { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground">
              {Number.isFinite(amount) && amount !== 0
                ? amount > 0
                  ? `Grants ${formatCredits(amount)} credits.`
                  : `Claws back ${formatCredits(Math.abs(amount))} credits.`
                : "Positive grants, negative claws back."}
            </p>
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bucket">Bucket</Label>
            <Select
              value={bucket}
              onValueChange={(value) =>
                setValue("bucket", value as FormValues["bucket"])
              }
            >
              <SelectTrigger id="bucket">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="topup">
                  Top-up — rolls over, never expires
                </SelectItem>
                <SelectItem value="plan">
                  Plan — cleared at the next refill
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reason">Reason</Label>
            <Input
              id="reason"
              placeholder="Goodwill credit for the 2026-09-02 outage"
              {...register("reason")}
            />
            {errors.reason && (
              <p className="text-sm text-destructive">{errors.reason.message}</p>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={adjust.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" form="adjust-credits" disabled={adjust.isPending}>
            {adjust.isPending ? "Applying..." : "Apply adjustment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
