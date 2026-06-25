import { Link, useRouterState } from "@tanstack/react-router";
import { Home, LayoutGrid, LayoutDashboard, Settings as SettingsIcon } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useHabits } from "@/lib/habits/store";

const tabs = [
  { to: "/", label: "Today", icon: Home },
  { to: "/habits", label: "Habits", icon: LayoutGrid },
  { to: "/widget", label: "Widget", icon: LayoutDashboard },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const ensureSeeded = useHabits((s) => s.ensureSeeded);
  useEffect(() => {
    ensureSeeded();
  }, [ensureSeeded]);

  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col bg-background text-foreground">
      <main className="flex-1 pb-24">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-border bg-background/85 backdrop-blur-xl">
        <ul className="grid grid-cols-4">
          {tabs.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <li key={to}>
                <Link
                  to={to}
                  className="flex flex-col items-center gap-1 py-3 text-[11px]"
                  style={{
                    color: active ? "var(--primary)" : "var(--muted-foreground)",
                  }}
                >
                  <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}