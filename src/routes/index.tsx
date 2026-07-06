import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { Plus, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { HabitTile } from "@/components/HabitTile";
import { useHabits } from "@/lib/habits/store";
import { isDueOn, currentStreak, weeklyReport, greetingFor } from "@/lib/habits/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — Loop" },
      { name: "description", content: "Today's habits. Hold a tile to mark it done." },
    ],
  }),
  component: TodayPage,
});

function TodayPage() {
  const habits = useHabits((s) => s.habits);
  const completions = useHabits((s) => s.completions);
  const userName = useHabits((s) => s.userName);
  const today = new Date();
  const due = habits.filter((h) => isDueOn(h, today));
  const doneCount = due.filter((h) =>
    completions.some((c) => c.habitId === h.id && c.date === format(today, "yyyy-MM-dd")),
  ).length;

  const topStreak = habits.reduce(
    (acc, h) => Math.max(acc, currentStreak(h, completions)),
    0,
  );
  const report = weeklyReport(habits, completions);
  const greeting = greetingFor(today);

  return (
    <AppShell>
      <header className="px-5 pt-10 pb-6">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {format(today, "EEEE, MMM d")}
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">
          {greeting}{userName ? `, ${userName}` : ""}
        </h1>
        <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
          <span className="rounded-full bg-card px-3 py-1">
            {doneCount}/{due.length} done
          </span>
          {topStreak > 0 && (
            <span className="rounded-full bg-card px-3 py-1">🔥 {topStreak} day streak</span>
          )}
        </div>
      </header>

      {habits.length > 0 && (
        <Link
          to="/report"
          className="mx-5 mb-6 flex items-center justify-between rounded-2xl bg-card p-4"
        >
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              This week
            </div>
            <div className="mt-1 text-2xl font-bold">{report.thisWeek.rate}%</div>
          </div>
          <DeltaBadge delta={report.delta} />
        </Link>
      )}

      {due.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-3 gap-y-7 gap-x-2 px-5">
          {due.map((h) => (
            <HabitTile key={h.id} habit={h} />
          ))}
        </div>
      )}

      {/* Anchored within the centered app column so it never clips off-screen. */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md justify-end px-5"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 5.5rem)" }}
      >
        <Link
          to="/habits/new"
          className="pointer-events-auto grid h-14 w-14 place-items-center rounded-full shadow-2xl transition-transform active:scale-95"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
            boxShadow: "0 10px 30px -10px color-mix(in oklab, var(--primary) 60%, transparent)",
          }}
          aria-label="Add habit"
        >
          <Plus size={26} strokeWidth={2.4} />
        </Link>
      </div>
    </AppShell>
  );
}

function DeltaBadge({ delta }: { delta: number }) {
  const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const color = delta > 0 ? "var(--primary)" : delta < 0 ? "var(--destructive)" : "var(--muted-foreground)";
  const label = delta === 0 ? "same as last week" : `${delta > 0 ? "+" : ""}${delta} pts vs last week`;
  return (
    <div className="flex items-center gap-2 rounded-full bg-background px-3 py-1.5 text-xs font-medium" style={{ color }}>
      <Icon size={14} />
      {label}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mx-5 mt-10 rounded-3xl border border-border bg-card p-8 text-center">
      <p className="text-sm text-muted-foreground">
        No habits for today yet.
      </p>
      <Link
        to="/habits/new"
        className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
        style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
      >
        <Plus size={16} /> Create your first habit
      </Link>
    </div>
  );
}