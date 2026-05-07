import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  children: ReactNode;
  className?: string;
};

export function AppSidebar({ children, className }: AppSidebarProps) {
  return (
    <aside
      className={cn(
        "rounded-lg border border-zinc-200 bg-white shadow-sm",
        className
      )}
    >
      {children}
    </aside>
  );
}
