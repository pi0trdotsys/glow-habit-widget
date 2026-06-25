import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { HabitTile } from "@/components/HabitTile";
import { useHabits } from "@/lib/habits/store";
import { isDueOn, currentStreak } from "@/lib/habits/utils";

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
  const today = new Date();
  const due = habits.filter((h) => isDueOn(h, today));
  const doneCount = due.filter((h) =>
    completions.some((c) => c.habitId === h.id && c.date === format(today, "yyyy-MM-dd")),
  ).length;

  const topStreak = habits.reduce(
    (acc, h) => Math.max(acc, currentStreak(h, completions)),
    0,
  );

  return (
    <AppShell>
      <header className="px-5 pt-10 pb-6">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {format(today, "EEEE, MMM d")}
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Today</h1>
        <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
          <span className="rounded-full bg-card px-3 py-1">
            {doneCount}/{due.length} done
          </span>
          {topStreak > 0 && (
            <span className="rounded-full bg-card px-3 py-1">🔥 {topStreak} day streak</span>
          )}
        </div>
      </header>

      {due.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-3 gap-y-7 gap-x-2 px-5">
          {due.map((h) => (
            <HabitTile key={h.id} habit={h} />
          ))}
        </div>
      )}

      <Link
        to="/habits/new"
        className="fixed bottom-24 right-1/2 z-30 grid h-14 w-14 translate-x-[208px] place-items-center rounded-full shadow-2xl"
        style={{
          backgroundColor: "var(--primary)",
          color: "var(--primary-foreground)",
          boxShadow: "0 10px 30px -10px color-mix(in oklab, var(--primary) 60%, transparent)",
        }}
        aria-label="Add habit"
      >
        <Plus size={26} strokeWidth={2.4} />
      </Link>
    </AppShell>
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