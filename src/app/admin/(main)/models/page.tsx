import { ModelProvidersView } from "@/features/model-providers/components";
import { requireAuth } from "@/lib/auth";

// No prefetch and no Suspense boundary, unlike the server-backed screens: the
// data is a local fixture, so there is nothing to dehydrate into the client.
export default async function ModelProvidersPage() {
  await requireAuth();

  return <ModelProvidersView />;
}
