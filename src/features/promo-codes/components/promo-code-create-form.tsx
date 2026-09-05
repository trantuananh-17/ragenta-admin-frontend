"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { DetailSection } from "@/components/detail-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCredits } from "@/lib/format";
import { useCreatePromoCode } from "../hooks/promo-codes.hook";

const schema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "At least three characters.")
      .max(40)
      .regex(
        /^[A-Za-z0-9][A-Za-z0-9-]*$/,
        "Letters, digits and hyphens — it gets typed by hand.",
      ),
    credits: z
      .number({ message: "Enter a whole number of credits." })
      .int("Credits are whole numbers.")
      .positive("A code that grants nothing is not worth creating."),
    bucket: z.enum(["topup", "plan"]),
    expiryMode: z.enum(["days", "date"]),
    expiresInDays: z.number().int().positive().optional(),
    expiresOn: z.string().optional(),
    maxRedemptions: z
      .number()
      .int()
      .positive("One redemption at least, or leave it blank for unlimited.")
      .optional(),
  })
  .superRefine((values, ctx) => {
    if (values.expiryMode === "days" && !values.expiresInDays) {
      ctx.addIssue({
        code: "custom",
        path: ["expiresInDays"],
        message: "How many days should it stay redeemable?",
      });
    }
    if (values.expiryMode === "date") {
      if (!values.expiresOn) {
        ctx.addIssue({
          code: "custom",
          path: ["expiresOn"],
          message: "Pick the last day it can be redeemed.",
        });
      } else if (new Date(values.expiresOn).valueOf() <= Date.now()) {
        ctx.addIssue({
          code: "custom",
          path: ["expiresOn"],
          message: "That date has passed.",
        });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

const defaults: FormValues = {
  code: "",
  credits: 1_000_000,
  bucket: "topup",
  expiryMode: "days",
  expiresInDays: 30,
  expiresOn: "",
  maxRedemptions: undefined,
};

/** Both expiry modes reduce to the one thing the code carries: an instant. */
function resolveExpiry(values: FormValues): string {
  if (values.expiryMode === "date" && values.expiresOn) {
    return new Date(`${values.expiresOn}T23:59:59.999Z`).toISOString();
  }
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + (values.expiresInDays ?? 30));
  return date.toISOString();
}

export function PromoCodeCreateForm() {
  const create = useCreatePromoCode();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  const bucket = watch("bucket");
  const expiryMode = watch("expiryMode");
  const credits = watch("credits");

  return (
    <DetailSection
      title="Create a code"
      description="A workspace redeems a code once. Redeeming posts a credit transaction against that workspace's balance, exactly as a top-up does."
    >
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={handleSubmit((values) =>
          create.mutate(
            {
              code: values.code,
              credits: values.credits,
              bucket: values.bucket,
              expiresAt: resolveExpiry(values),
              maxRedemptions: values.maxRedemptions ?? null,
            },
            { onSuccess: () => reset(defaults) },
          ),
        )}
      >
        <div className="grid gap-2">
          <Label htmlFor="promo-code">Code</Label>
          <Input
            id="promo-code"
            placeholder="LAUNCH2026"
            className="font-mono uppercase"
            {...register("code", {
              setValueAs: (value: string) => value.toUpperCase(),
            })}
          />
          {errors.code && (
            <p className="text-sm text-destructive">{errors.code.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="promo-credits">Credits granted</Label>
          <Input
            id="promo-credits"
            type="number"
            step={1}
            min={1}
            {...register("credits", { valueAsNumber: true })}
          />
          <p className="text-xs text-muted-foreground">
            {Number.isFinite(credits) && credits > 0
              ? `${formatCredits(credits)} credits per workspace.`
              : "Per workspace, once."}
          </p>
          {errors.credits && (
            <p className="text-sm text-destructive">{errors.credits.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="promo-bucket">Bucket</Label>
          <Select
            value={bucket}
            onValueChange={(value) =>
              setValue("bucket", value as FormValues["bucket"])
            }
          >
            <SelectTrigger id="promo-bucket">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="topup">
                Top-up — rolls over, never expires
              </SelectItem>
              <SelectItem value="plan">
                Plan — cleared at the workspace&apos;s next refill
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Plan credits are wiped at the next refill, so a promo landing there
            can be worth nothing by the time it is spent. Top-up is the usual
            choice.
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="promo-max">Max redemptions</Label>
          <Input
            id="promo-max"
            type="number"
            step={1}
            min={1}
            placeholder="Unlimited"
            {...register("maxRedemptions", {
              setValueAs: (value: string) =>
                value === "" ? undefined : Number(value),
            })}
          />
          {errors.maxRedemptions && (
            <p className="text-sm text-destructive">
              {errors.maxRedemptions.message}
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="promo-expiry-mode">Code expiry</Label>
          <Select
            value={expiryMode}
            onValueChange={(value) =>
              setValue("expiryMode", value as FormValues["expiryMode"])
            }
          >
            <SelectTrigger id="promo-expiry-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="days">Days from now</SelectItem>
              <SelectItem value="date">A fixed date</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          {expiryMode === "days" ? (
            <>
              <Label htmlFor="promo-days">Days</Label>
              <Input
                id="promo-days"
                type="number"
                step={1}
                min={1}
                {...register("expiresInDays", { valueAsNumber: true })}
              />
              {errors.expiresInDays && (
                <p className="text-sm text-destructive">
                  {errors.expiresInDays.message}
                </p>
              )}
            </>
          ) : (
            <>
              <Label htmlFor="promo-date">Last redeemable day</Label>
              <Input id="promo-date" type="date" {...register("expiresOn")} />
              {errors.expiresOn && (
                <p className="text-sm text-destructive">
                  {errors.expiresOn.message}
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end sm:col-span-2">
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Creating..." : "Create code"}
          </Button>
        </div>
      </form>
    </DetailSection>
  );
}
