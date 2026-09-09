"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { menuGroups } from "@/components/app-sidebar";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";

/**
 * Where you are, derived from the same `menuGroups` the sidebar renders — one
 * list, so a renamed destination cannot say two different things.
 *
 * This console nests three levels deep across thirty-odd routes and the bar
 * used to carry nothing but a sidebar toggle. On a detail route the section
 * stays a link, which is the way back to the list; the record's own name is the
 * page's `h1` rather than a third crumb, because the crumb would have to wait
 * for the record to load and the heading already says it.
 */
function useTrail() {
  const pathname = usePathname();

  const match = menuGroups
    .flatMap((group) =>
      group.items.map((item) => ({ group: group.label, ...item })),
    )
    // Longest match wins: "/admin" is a prefix of every other destination.
    .filter(
      (item) => pathname === item.url || pathname.startsWith(`${item.url}/`),
    )
    .sort((a, b) => b.url.length - a.url.length)[0];

  if (!match) return null;
  return { ...match, isSection: pathname === match.url };
}

export function AppHeader() {
  const trail = useTrail();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger />
        {trail && (
          <Breadcrumb className="min-w-0">
            <BreadcrumbList>
              {trail.group && (
                <>
                  <BreadcrumbItem className="hidden sm:block">
                    {trail.group}
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden sm:block" />
                </>
              )}
              <BreadcrumbItem className="min-w-0">
                {trail.isSection ? (
                  <BreadcrumbPage className="truncate">
                    {trail.title}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={trail.url} className="truncate">
                      {trail.title}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        )}
      </div>
      <ThemeToggleButton />
    </header>
  );
}
