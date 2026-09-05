import { Link, useRouterState } from "@tanstack/react-router";
import { Home, PenLine, LineChart, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Today", icon: Home },
  { to: "/checkin", label: "Check in", icon: PenLine },
  { to: "/trends", label: "Trends", icon: LineChart },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen trend-glow">
      <main className="mx-auto w-full max-w-lg px-5 pt-8 pb-28">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/90 backdrop-blur-md">
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.6} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
