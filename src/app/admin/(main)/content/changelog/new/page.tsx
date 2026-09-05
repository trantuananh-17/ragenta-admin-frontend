import { ChangelogCreate } from "@/features/changelog/components";
import { requireAuth } from "@/lib/auth";

export default async function NewChangelogEntryPage() {
  await requireAuth();

  return <ChangelogCreate />;
}
