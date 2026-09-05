"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  CreditCard,
  FileText,
  Gavel,
  LayoutList,
  LogOut,
  Megaphone,
  ScrollText,
  Settings2,
  Sparkles,
  UserCircle,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useLogout } from "@/features/auth/hooks/auth.hook";

type MenuItem = { title: string; icon: typeof BarChart3; url: string };
type MenuGroup = { label?: string; items: MenuItem[] };

/**
 * The nav is the product's table of contents, grouped by which backend owns the
 * data: Platform and Billing are `ragenta-backend`; Landing content is
 * `ragenta-content-backend`.
 */
const menuGroups: MenuGroup[] = [
  {
    items: [{ title: "Dashboard", icon: BarChart3, url: "/admin" }],
  },
  {
    label: "Platform",
    items: [
      { title: "Users", icon: UserCircle, url: "/admin/users" },
      { title: "Workspaces", icon: Building2, url: "/admin/workspaces" },
    ],
  },
  {
    label: "Billing",
    items: [{ title: "Plans", icon: CreditCard, url: "/admin/plans" }],
  },
  {
    label: "Landing content",
    items: [
      { title: "Blog posts", icon: FileText, url: "/admin/content/posts" },
      { title: "Changelog", icon: ScrollText, url: "/admin/content/changelog" },
      { title: "Catalogue", icon: Sparkles, url: "/admin/content/catalogue" },
      { title: "Announcement", icon: Megaphone, url: "/admin/content/announcement" },
      { title: "Legal", icon: Gavel, url: "/admin/content/legal" },
      { title: "Site settings", icon: Settings2, url: "/admin/content/site-metadata" },
    ],
  },
  {
    label: "System",
    items: [{ title: "Audit log", icon: LayoutList, url: "/admin/audit-log" }],
  },
];

function LogoutButton() {
  const logout = useLogout();

  return (
    <SidebarMenuButton
      tooltip="Sign out"
      onClick={() => logout.mutate()}
      disabled={logout.isPending}
      className="h-10 gap-x-4 px-4"
    >
      <LogOut className="size-4" />
      <span>{logout.isPending ? "Signing out..." : "Sign out"}</span>
    </SidebarMenuButton>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenuItem className="list-none">
          <SidebarMenuButton asChild className="h-10 gap-x-4 px-4">
            <Link href="/admin" prefetch>
              <span className="flex size-5 shrink-0 items-center justify-center rounded bg-primary text-[11px] font-bold text-primary-foreground">
                R
              </span>
              <span className="text-sm font-semibold">Ragenta Admin</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarHeader>
      <SidebarContent>
        {menuGroups.map((group, index) => (
          <SidebarGroup key={group.label ?? `group-${index}`}>
            {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={
                        item.url === "/admin"
                          ? pathname === "/admin"
                          : pathname.startsWith(item.url)
                      }
                      asChild
                      className="h-10 gap-x-4 px-4"
                    >
                      <Link href={item.url}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <LogoutButton />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
