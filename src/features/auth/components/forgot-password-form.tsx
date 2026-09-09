"use client";

import Link from "next/link";
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
import { useRequestPasswordReset } from "../hooks/auth.hook";

const schema = z.object({ email: z.email("Enter a valid email address.") });

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const request = useRequestPasswordReset();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>
          We will email you a link to choose a new one.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((values) => request.mutate(values.email))}>
          <FieldGroup>
            <Field data-invalid={errors.email ? true : undefined}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                disabled={request.isPending}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
              />
              <FieldError id="email-error" errors={[errors.email]} />
            </Field>

            <Button
              type="submit"
              className="w-full"
              disabled={request.isPending}
            >
              {request.isPending && <Spinner data-icon="inline-start" />}
              Send reset link
            </Button>

            <Button variant="ghost" asChild className="w-full">
              <Link href="/login">Back to sign in</Link>
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
