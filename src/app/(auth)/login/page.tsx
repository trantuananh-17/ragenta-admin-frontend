import { Suspense } from "react";

import { LoginForm } from "@/features/auth/components";
import { requireUnAuth } from "@/lib/auth";

export default async function LoginPage() {
  await requireUnAuth();

  // `useSearchParams` in the form makes it a client boundary that must be
  // suspended, or the whole route opts out of static rendering.
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
