import { CatalogueCreate } from "@/features/catalogue/components";
import { requireAuth } from "@/lib/auth";

export default async function NewCatalogueItemPage() {
  await requireAuth();

  return <CatalogueCreate />;
}
