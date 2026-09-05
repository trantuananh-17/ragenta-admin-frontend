import { PromoCodesView } from "@/features/promo-codes/components";
import { requireAuth } from "@/lib/auth";

// No prefetch and no Suspense boundary, unlike the server-backed screens: the
// data is a local fixture, so there is nothing to dehydrate into the client.
export default async function PromoCodesPage() {
  await requireAuth();

  return <PromoCodesView />;
}
