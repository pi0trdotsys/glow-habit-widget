import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { HabitIcon } from "@/components/HabitIcon";
import { useHabits } from "@/lib/habits/store";
import { HABIT_COLOR_VAR, HABIT_COLORS, HABIT_ICONS } from "@/lib/habits/colors";
import type { HabitColor, HabitScheduleType } from "@/lib/habits/types";

export const Route = createFileRoute("/habits/new")({
  head: () => ({ meta: [{ title: "New habit — Loop" }] }),
  component: NewHabit,
});

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function NewHabit() {
  const navigate = useNavigate();
  const addHabit = useHabits((s) => s.addHabit);
  const count = useHabits((s) => s.habits.length);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState<string>("Sparkles");
  const [color, setColor] = useState<HabitColor>("mint");
  const [type, setType] = useState<HabitScheduleType>("daily");
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [target, setTarget] = useState(3);

  const canSave = name.trim().length > 0 && count < 24;

  const save = () => {
    if (!canSave) return;
    addHabit({
      name: name.trim(),
      icon,
      color,
      schedule:
        type === "daily"
          ? { type: "daily" }
          : type === "weekdays"
          ? { type: "weekdays", days }
          : { type: "timesPerWeek", target },
    });
    navigate({ to: "/" });
  };

  return (
    <AppShell>
      <header className="flex items-center justify-between px-5 pt-8 pb-4">
        <button
          onClick={() => navigate({ to: "/habits" })}
          className="grid h-10 w-10 place-items-center rounded-full bg-card"
          aria-label="Back"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={save}
          disabled={!canSave}
          className="rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-40"
          style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
        >
          Save
        </button>
      </header>

      <div className="px-5 pb-10">
        <div className="flex flex-col items-center gap-4 py-4">
          <div
            className="grid h-24 w-24 place-items-center rounded-full"
            style={{
              backgroundColor: `color-mix(in oklab, ${HABIT_COLOR_VAR[color]} 22%, transparent)`,
              boxShadow: `0 0 0 2px ${HABIT_COLOR_VAR[color]}`,
            }}
          >
            <HabitIcon name={icon} size={42} strokeWidth={1.8} />
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Habit name"
            className="w-full rounded-2xl bg-card px-4 py-3 text-center text-lg font-medium outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ring"
            maxLength={40}
          />
        </div>

        <Section title="Color">
          <div className="flex flex-wrap gap-3">
            {HABIT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="h-10 w-10 rounded-full transition"
                style={{
                  backgroundColor: HABIT_COLOR_VAR[c],
                  outline: color === c ? "3px solid var(--foreground)" : "none",
                  outlineOffset: 2,
                }}
                aria-label={c}
              />
            ))}
          </div>
        </Section>

        <Section title="Icon">
          <div className="grid grid-cols-6 gap-2">
            {HABIT_ICONS.map((i) => (
              <button
                key={i}
                onClick={() => setIcon(i)}
                className="grid aspect-square place-items-center rounded-xl bg-card transition"
                style={{
                  outline: icon === i ? "2px solid var(--primary)" : "none",
                }}
              >
                <HabitIcon name={i} size={20} strokeWidth={1.8} />
              </button>
            ))}
          </div>
        </Section>

        <Section title="Schedule">
          <div className="flex gap-2">
            {(["daily", "weekdays", "timesPerWeek"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className="flex-1 rounded-full px-3 py-2 text-xs font-medium"
                style={{
                  backgroundColor: type === t ? "var(--primary)" : "var(--card)",
                  color: type === t ? "var(--primary-foreground)" : "var(--foreground)",
                }}
              >
                {t === "daily" ? "Daily" : t === "weekdays" ? "Days" : "X / week"}
              </button>
            ))}
          </div>

          {type === "weekdays" && (
            <div className="mt-3 flex justify-between">
              {DAY_LABELS.map((label, idx) => {
                const on = days.includes(idx);
                return (
                  <button
                    key={idx}
                    onClick={() =>
                      setDays((d) =>
                        on ? d.filter((x) => x !== idx) : [...d, idx].sort(),
                      )
                    }
                    className="h-10 w-10 rounded-full text-sm font-semibold"
                    style={{
                      backgroundColor: on ? "var(--primary)" : "var(--card)",
                      color: on ? "var(--primary-foreground)" : "var(--muted-foreground)",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {type === "timesPerWeek" && (
            <div className="mt-3 flex items-center justify-center gap-4 rounded-2xl bg-card py-4">
              <button
                onClick={() => setTarget(Math.max(1, target - 1))}
                className="h-9 w-9 rounded-full bg-secondary text-lg"
              >
                −
              </button>
              <span className="w-16 text-center text-2xl font-bold">{target}×</span>
              <button
                onClick={() => setTarget(Math.min(7, target + 1))}
                className="h-9 w-9 rounded-full bg-secondary text-lg"
              >
                +
              </button>
            </div>
          )}
        </Section>

        {count >= 24 && (
          <p className="mt-4 text-center text-xs text-destructive">
            You've reached the 24-habit limit.
          </p>
        )}
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}