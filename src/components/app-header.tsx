import { ThemeToggleButton } from "./theme-toggle-button";
import { SidebarTrigger } from "./ui/sidebar";

export function AppHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
      <SidebarTrigger />
      <ThemeToggleButton />
    </header>
  );
}
