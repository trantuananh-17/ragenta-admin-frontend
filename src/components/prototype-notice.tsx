import { FlaskConical } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A screen whose data is local fixtures rather than a backend says so, in the
 * same words everywhere. Without it, an admin has no way to tell a page that
 * quietly failed to save from one that was never able to.
 */
export function PrototypeNotice({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300",
        className,
      )}
    >
      <FlaskConical className="mt-0.5 size-4 shrink-0" />
      <div className="space-y-1">
        <p className="font-medium">Prototype — nothing here is saved</p>
        <p className="text-amber-800/80 dark:text-amber-300/80">{children}</p>
      </div>
    </div>
  );
}
