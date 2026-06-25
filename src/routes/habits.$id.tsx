import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { HabitIcon } from "@/components/HabitIcon";
import { useHabits } from "@/lib/habits/store";
import { HABIT_COLOR_VAR } from "@/lib/habits/colors";
import {
  completionRate,
  currentStreak,
  heatmapData,
  longestStreak,
  thisWeekCount,
} from "@/lib/habits/utils";

export const Route = createFileRoute("/habits/$id")({
  head: () => ({ meta: [{ title: "Habit — Loop" }] }),
  component: HabitDetail,
});

function HabitDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const habit = useHabits((s) => s.habits.find((h) => h.id === id));
  const completions = useHabits((s) => s.completions);
  const removeHabit = useHabits((s) => s.removeHabit);

  if (!habit) {
    return (
      <AppShell>
        <div className="p-8 text-center text-muted-foreground">Habit not found.</div>
      </AppShell>
    );
  }

  const color = HABIT_COLOR_VAR[habit.color];
  const heat = heatmapData(habit, completions, 84);
  const streak = currentStreak(habit, completions);
  const longest = longestStreak(habit, completions);
  const week = thisWeekCount(habit, completions);
  const rate = completionRate(habit, completions, 30);

  return (
    <AppShell>
      <header className="flex items-center justify-between px-5 pt-8">
        <button
          onClick={() => navigate({ to: "/habits" })}
          className="grid h-10 w-10 place-items-center rounded-full bg-card"
          aria-label="Back"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => {
            if (confirm(`Delete "${habit.name}"?`)) {
              removeHabit(habit.id);
              navigate({ to: "/habits" });
            }
          }}
          className="grid h-10 w-10 place-items-center rounded-full bg-card text-destructive"
          aria-label="Delete"
        >
          <Trash2 size={18} />
        </button>
      </header>

      <div className="flex flex-col items-center gap-3 px-5 pb-8 pt-4">
        <div
          className="grid h-24 w-24 place-items-center rounded-full"
          style={{
            backgroundColor: `color-mix(in oklab, ${color} 22%, transparent)`,
            boxShadow: `0 0 0 2px ${color}`,
          }}
        >
          <HabitIcon name={habit.icon} size={44} strokeWidth={1.8} />
        </div>
        <h1 className="font-display text-3xl font-bold">{habit.name}</h1>
        <p className="text-xs text-muted-foreground">
          {habit.schedule.type === "daily" && "Every day"}
          {habit.schedule.type === "weekdays" &&
            `${habit.schedule.days?.length ?? 0} days / week`}
          {habit.schedule.type === "timesPerWeek" &&
            `${habit.schedule.target}× per week`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 px-5">
        <Stat label="Current streak" value={`${streak}d`} accent={color} />
        <Stat label="Longest streak" value={`${longest}d`} accent={color} />
        <Stat label="This week" value={`${week}`} accent={color} />
        <Stat label="30-day rate" value={`${rate}%`} accent={color} />
      </div>

      <section className="mt-8 px-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Last 12 weeks
        </h2>
        <div
          className="grid grid-flow-col gap-1 rounded-2xl bg-card p-3"
          style={{ gridTemplateRows: "repeat(7, 1fr)" }}
        >
          {heat.map((d) => (
            <div
              key={d.date}
              className="aspect-square rounded-[4px]"
              style={{
                backgroundColor: d.done
                  ? color
                  : "color-mix(in oklab, var(--foreground) 6%, transparent)",
              }}
              title={d.date}
            />
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl bg-card p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold" style={{ color: accent }}>
        {value}
      </div>
    </div>
  );
}