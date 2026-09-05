import { ForgotPasswordForm } from "@/features/auth/components";
import { requireUnAuth } from "@/lib/auth";

export default async function ForgotPasswordPage() {
  await requireUnAuth();

  return <ForgotPasswordForm />;
}
