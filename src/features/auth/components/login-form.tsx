"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGoogleSignIn, useLogin } from "../hooks/auth.hook";

const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const login = useLogin();
  const googleSignIn = useGoogleSignIn();
  const searchParams = useSearchParams();
  const notAdmin = searchParams.get("reason") === "not-admin";

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
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            That account is signed in but is not a platform administrator.
          </div>
        )}

        <form onSubmit={handleSubmit((values) => login.mutate(values))}>
          <div className="grid gap-6">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={pending}
              onClick={() => googleSignIn.mutate()}
            >
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@ragenta.cloud"
                disabled={pending}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                disabled={pending}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={pending}>
              {login.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Sign in
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
