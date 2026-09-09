"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useResetPassword } from "../hooks/auth.hook";

const schema = z
  .object({
    newPassword: z.string().min(8, "Use at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "The two passwords do not match.",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const reset = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  if (!token) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Link is not valid</CardTitle>
          <CardDescription>
            This reset link is missing its token, or has already expired.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/forgot-password">Request a new link</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Choose a new password</CardTitle>
        <CardDescription>It replaces the one you had.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((values) =>
            reset.mutate({ token, newPassword: values.newPassword }),
          )}
        >
          <FieldGroup>
            <Field data-invalid={errors.newPassword ? true : undefined}>
              <FieldLabel htmlFor="newPassword">New password</FieldLabel>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                disabled={reset.isPending}
                aria-invalid={!!errors.newPassword}
                aria-describedby={
                  errors.newPassword ? "newPassword-error" : undefined
                }
                {...register("newPassword")}
              />
              <FieldError
                id="newPassword-error"
                errors={[errors.newPassword]}
              />
            </Field>

            <Field data-invalid={errors.confirmPassword ? true : undefined}>
              <FieldLabel htmlFor="confirmPassword">
                Confirm new password
              </FieldLabel>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                disabled={reset.isPending}
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={
                  errors.confirmPassword ? "confirmPassword-error" : undefined
                }
                {...register("confirmPassword")}
              />
              <FieldError
                id="confirmPassword-error"
                errors={[errors.confirmPassword]}
              />
            </Field>

            <Button type="submit" className="w-full" disabled={reset.isPending}>
              {reset.isPending && <Spinner data-icon="inline-start" />}
              Update password
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
