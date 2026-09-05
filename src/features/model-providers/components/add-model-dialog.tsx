"use client";

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
import { useAddCustomModel } from "../hooks/model-providers.hook";
import type { ModelProvider } from "../service/model-providers.service";

const schema = z.object({
  model: z
    .string()
    .trim()
    .min(1, "The provider's own model id, exactly as it appears in their API."),
  capability: z.enum(["chat", "embedding"]),
  tier: z.enum(["economy", "premium"]),
  contextWindow: z.number().int().positive().optional(),
  inputPerMillion: z.number().nonnegative(),
  outputPerMillion: z.number().nonnegative(),
  embeddingPerMillion: z.number().nonnegative(),
});

type FormValues = z.infer<typeof schema>;

const defaults: FormValues = {
  model: "",
  capability: "chat",
  tier: "premium",
  contextWindow: undefined,
  inputPerMillion: 0,
  outputPerMillion: 0,
  embeddingPerMillion: 0,
};

/**
 * Rates are asked for rather than looked up, because they are what usage is
 * billed on. A model added with a zero rate is a model customers run for free.
 */
export function AddModelDialog({
  provider,
  open,
  onOpenChange,
}: {
  provider: ModelProvider;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const add = useAddCustomModel(provider.id);

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

  const capability = watch("capability");
  const tier = watch("tier");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset(defaults);
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a {provider.name} model</DialogTitle>
          <DialogDescription>
            For a model the catalogue does not ship yet — a new release, or one
            only this deployment has access to.
          </DialogDescription>
        </DialogHeader>

        <form
          id="add-model"
          className="grid gap-4"
          onSubmit={handleSubmit((values) =>
            add.mutate(
              {
                model: values.model,
                capability: values.capability,
                tier: values.tier,
                contextWindow: values.contextWindow ?? null,
                rates: {
                  inputPerMillion: values.inputPerMillion,
                  outputPerMillion: values.outputPerMillion,
                  embeddingPerMillion: values.embeddingPerMillion,
                },
              },
              {
                onSuccess: () => {
                  reset(defaults);
                  onOpenChange(false);
                },
              },
            ),
          )}
        >
          <div className="grid gap-2">
            <Label htmlFor="model-id">Model id</Label>
            <Input
              id="model-id"
              className="font-mono"
              placeholder="claude-sonnet-5"
              {...register("model")}
            />
            {errors.model && (
              <p className="text-sm text-destructive">{errors.model.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="model-capability">Capability</Label>
              <Select
                value={capability}
                onValueChange={(value) =>
                  setValue("capability", value as FormValues["capability"])
                }
              >
                <SelectTrigger id="model-capability">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chat">Chat</SelectItem>
                  <SelectItem value="embedding">Embedding</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="model-tier">Plan tier</Label>
              <Select
                value={tier}
                onValueChange={(value) =>
                  setValue("tier", value as FormValues["tier"])
                }
              >
                <SelectTrigger id="model-tier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="economy">
                    Economy — every plan, free included
                  </SelectItem>
                  <SelectItem value="premium">Premium — paid plans</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {capability === "chat" ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="model-context">Context window</Label>
                <Input
                  id="model-context"
                  type="number"
                  step={1000}
                  min={1}
                  placeholder="200000"
                  {...register("contextWindow", {
                    setValueAs: (value: string) =>
                      value === "" ? undefined : Number(value),
                  })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="model-input-rate">Input $/M</Label>
                <Input
                  id="model-input-rate"
                  type="number"
                  step="0.01"
                  min={0}
                  {...register("inputPerMillion", { valueAsNumber: true })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="model-output-rate">Output $/M</Label>
                <Input
                  id="model-output-rate"
                  type="number"
                  step="0.01"
                  min={0}
                  {...register("outputPerMillion", { valueAsNumber: true })}
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="model-embedding-rate">Embedding $/M</Label>
              <Input
                id="model-embedding-rate"
                type="number"
                step="0.001"
                min={0}
                {...register("embeddingPerMillion", { valueAsNumber: true })}
              />
            </div>
          )}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={add.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" form="add-model" disabled={add.isPending}>
            {add.isPending ? "Adding..." : "Add model"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
