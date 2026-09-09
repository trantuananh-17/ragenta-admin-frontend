"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AlertCircle } from "lucide-react";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  EmailNotVerifiedError,
  useGoogleSignIn,
  useLogin,
  useResendVerificationEmail,
} from "../hooks/auth.hook";

const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const login = useLogin();
  const googleSignIn = useGoogleSignIn();
  const resendVerification = useResendVerificationEmail();
  const searchParams = useSearchParams();
  const notAdmin = searchParams.get("reason") === "not-admin";
  // A verification link that no longer works comes back here carrying `error`;
  // a working one signs the account in and never reaches this form.
  const verificationLinkFailed = searchParams.has("error");

  const unverified =
    login.error instanceof EmailNotVerifiedError ? login.error : null;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const pending = login.isPending || googleSignIn.isPending;

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Ragenta Admin</CardTitle>
        <CardDescription>Sign in to the internal console</CardDescription>
      </CardHeader>
      <CardContent>
        {notAdmin && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle />
            <AlertDescription>
              That account is signed in but is not a platform administrator.
            </AlertDescription>
          </Alert>
        )}

        {verificationLinkFailed && !unverified && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle />
            <AlertDescription>
              That verification link did not work — it may have expired or been
              used already. Sign in below and we will offer you a new one.
            </AlertDescription>
          </Alert>
        )}

        {unverified && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle />
            <AlertDescription className="grid justify-items-start gap-2">
              <span>
                Confirm {unverified.email} before signing in — the console needs
                a verified address, and the link is in the message we sent.
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={resendVerification.isPending}
                onClick={() => resendVerification.mutate(unverified.email)}
              >
                {resendVerification.isPending && <Spinner data-icon="inline-start" />}
                Send a new verification link
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit((values) => login.mutate(values))}>
          <FieldGroup>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={pending}
              onClick={() => googleSignIn.mutate()}
            >
              {googleSignIn.isPending && <Spinner data-icon="inline-start" />}
              Continue with Google
            </Button>

            {/* `FieldSeparator` paints its label `bg-background`; this one sits
                on a `Card`, which is two steps lighter in dark mode. */}
            <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
              Or continue with email
            </FieldSeparator>

            <Field data-invalid={errors.email ? true : undefined}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@ragenta.cloud"
                disabled={pending}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
              />
              <FieldError id="email-error" errors={[errors.email]} />
            </Field>

            <Field data-invalid={errors.password ? true : undefined}>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Link
                  href="/forgot-password"
                  className="rounded-sm text-xs text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                disabled={pending}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                {...register("password")}
              />
              <FieldError id="password-error" errors={[errors.password]} />
            </Field>

            <Button type="submit" className="w-full" disabled={pending}>
              {login.isPending && <Spinner data-icon="inline-start" />}
              Sign in
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
