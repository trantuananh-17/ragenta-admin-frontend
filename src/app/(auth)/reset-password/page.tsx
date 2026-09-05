import { Suspense } from "react";

import { ResetPasswordForm } from "@/features/auth/components";

export default function ResetPasswordPage() {
  // No `requireUnAuth` here: arriving with a valid token is the point, and a
  // signed-in admin resetting their own password is a legitimate flow.
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
