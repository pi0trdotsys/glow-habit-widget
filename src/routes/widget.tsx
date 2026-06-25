import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { HabitTile } from "@/components/HabitTile";
import { useHabits } from "@/lib/habits/store";
import { isDueOn } from "@/lib/habits/utils";
import { useEffect } from "react";

export const Route = createFileRoute("/widget")({
  head: () => ({
    meta: [
      { title: "Widget — Loop" },
      { name: "description", content: "Quick widget view: hold a tile to complete." },
    ],
  }),
  component: WidgetPage,
});

function WidgetPage() {
  const ensureSeeded = useHabits((s) => s.ensureSeeded);
  useEffect(() => ensureSeeded(), [ensureSeeded]);
  const habits = useHabits((s) => s.habits);
  const completions = useHabits((s) => s.completions);
  const today = new Date();
  const due = habits.filter((h) => isDueOn(h, today)).slice(0, 8);
  const doneCount = due.filter((h) =>
    completions.some(
      (c) => c.habitId === h.id && c.date === format(today, "yyyy-MM-dd"),
    ),
  ).length;

  return (
    <div
      className="min-h-[100dvh] bg-background text-foreground"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 0%, color-mix(in oklab, var(--primary) 14%, transparent), transparent 50%)",
      }}
    >
      <div className="mx-auto max-w-md p-5">
        <div className="rounded-[28px] border border-border bg-card/80 p-5 shadow-2xl backdrop-blur-xl">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {format(today, "EEE, MMM d")}
              </p>
              <h1 className="mt-1 text-xl font-bold tracking-tight">
                Loop · {doneCount}/{due.length}
              </h1>
            </div>
            <Link
              to="/"
              className="rounded-full bg-secondary px-3 py-1 text-[11px] font-medium text-secondary-foreground"
            >
              Open app
            </Link>
          </div>

          {due.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No habits scheduled.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-y-5 gap-x-1">
              {due.map((h) => (
                <HabitTile key={h.id} habit={h} compact />
              ))}
            </div>
          )}

          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            Press & hold a habit to complete it
          </p>
        </div>
      </div>
    </div>
  );
}