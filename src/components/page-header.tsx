import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { InfoHint } from "@/components/info-hint";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  back?: { href: string; label: string };
  title: React.ReactNode;
  description?: React.ReactNode;
  /** The longer explanation, shown on hover beside the title. */
  info?: React.ReactNode;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/** The header of a detail screen — list screens use `EntityHeader` instead. */
export function PageHeader({
  back,
  title,
  description,
  info,
  badges,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {back && (
        <Link
          href={back.href}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            {title}
            {info && <InfoHint>{info}</InfoHint>}
          </h1>
          {description && (
            <div className="text-sm text-muted-foreground">{description}</div>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
      {badges && <div className="flex flex-wrap items-center gap-2">{badges}</div>}
    </div>
  );
}
