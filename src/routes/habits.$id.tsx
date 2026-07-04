import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, Trash2, Bell } from "lucide-react";
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
  todayKey,
} from "@/lib/habits/utils";

export const Route = createFileRoute("/habits/$id")({
  head: () => ({ meta: [{ title: "Habit - Loop" }] }),
  component: HabitDetail,
});

function HabitDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const habit = useHabits((s) => s.habits.find((h) => h.id === id));
  const completions = useHabits((s) => s.completions);
  const removeHabit = useHabits((s) => s.removeHabit);
  const setCompletion = useHabits((s) => s.setCompletion);
  const updateHabit = useHabits((s) => s.updateHabit);

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
  const todayK = todayKey();

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

      <div className="mt-3 px-5">
        <ReminderCard
          value={habit.reminder ?? null}
          accent={color}
          onChange={(r) => updateHabit(habit.id, { reminder: r })}
        />
      </div>

      <section className="mt-8 px-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Last 12 weeks · tap to edit
        </h2>
        <div
          className="grid grid-flow-col gap-1 rounded-2xl bg-card p-3"
          style={{ gridTemplateRows: "repeat(7, 1fr)" }}
        >
          {heat.map((d) => (
            <button
              key={d.date}
              type="button"
              onClick={() => setCompletion(habit.id, d.date, !d.done)}
              disabled={d.date > todayK}
              className="aspect-square rounded-[4px] transition-transform active:scale-90 disabled:opacity-30"
              style={{
                backgroundColor: d.done
                  ? color
                  : "color-mix(in oklab, var(--foreground) 6%, transparent)",
                outline: d.date === todayK ? `1.5px solid ${color}` : undefined,
                outlineOffset: d.date === todayK ? "1px" : undefined,
              }}
              title={d.date}
              aria-label={`${d.date} ${d.done ? "completed" : "not completed"}`}
            />
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Tap any day to mark it done or undo it.
        </p>
      </section>
    </AppShell>
  );
}

function ReminderCard({
  value,
  accent,
  onChange,
}: {
  value: string | null;
  accent: string;
  onChange: (reminder: string | null) => void;
}) {
  const on = value != null;
  const [time, setTime] = useState(value ?? "08:00");

  return (
    <div className="rounded-2xl bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell size={18} style={{ color: accent }} />
          <span className="font-medium">Daily reminder</span>
        </div>
        <label className="relative inline-flex h-6 w-11 cursor-pointer items-center">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={on}
            onChange={(e) => onChange(e.target.checked ? time : null)}
          />
          <span className="absolute inset-0 rounded-full bg-muted peer-checked:bg-primary transition-colors" />
          <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-background transition-transform peer-checked:translate-x-5" />
        </label>
      </div>
      {on && (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Time</span>
          <input
            type="time"
            value={time}
            onChange={(e) => {
              setTime(e.target.value);
              onChange(e.target.value);
            }}
            className="rounded-xl border border-border bg-background px-3 py-1.5 text-sm outline-none"
          />
        </div>
      )}
      <p className="mt-2 text-[11px] text-muted-foreground">
        Get a notification for this habit at this time each day. Turn on
        notifications in Settings first.
      </p>
    </div>
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