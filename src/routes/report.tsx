import { createFileRoute, Link } from "@tanstack/react-router";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { HabitIcon } from "@/components/HabitIcon";
import { useHabits } from "@/lib/habits/store";
import { weeklyReport } from "@/lib/habits/utils";
import { HABIT_COLOR_VAR } from "@/lib/habits/colors";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Weekly report — Loop" },
      { name: "description", content: "Your weekly habit progress vs last week." },
    ],
  }),
  component: ReportPage,
});

function summary(delta: number, userName: string | null) {
  const who = userName ? `${userName}, ` : "";
  if (delta > 10) return `${who}you crushed it — way ahead of last week.`;
  if (delta > 0) return `${who}nice — a bit better than last week.`;
  if (delta === 0) return `${who}steady — matching last week exactly.`;
  if (delta > -10) return `${who}slightly off pace — small push will fix it.`;
  return `${who}rough week — reset and start fresh tomorrow.`;
}

function ReportPage() {
  const habits = useHabits((s) => s.habits);
  const completions = useHabits((s) => s.completions);
  const userName = useHabits((s) => s.userName);
  const r = weeklyReport(habits, completions);

  return (
    <AppShell>
      <header className="px-5 pt-10 pb-6">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Mon → today
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">
          Weekly report
        </h1>
      </header>

      <section className="mx-5 rounded-3xl bg-card p-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Completion
            </div>
            <div className="mt-1 font-display text-5xl font-bold">
              {r.thisWeek.rate}%
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {r.thisWeek.done} of {r.thisWeek.due} done
            </div>
          </div>
          <Delta delta={r.delta} />
        </div>
        <p className="mt-5 text-sm text-muted-foreground">
          {summary(r.delta, userName)}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Mini label="Last week" value={`${r.lastWeek.rate}%`} sub={`${r.lastWeek.done}/${r.lastWeek.due}`} />
          <Mini label="Change" value={`${r.delta > 0 ? "+" : ""}${r.delta}`} sub="percentage pts" />
        </div>
      </section>

      <section className="mt-8 px-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Per habit
        </h2>
        {habits.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            <Link to="/habits/new" className="underline">Add a habit</Link> to start tracking.
          </p>
        ) : (
          <ul className="space-y-2">
            {r.perHabit.map((p) => {
              const color = HABIT_COLOR_VAR[p.habit.color];
              const diff = p.this - p.last;
              return (
                <Link
                  key={p.habit.id}
                  to="/habits/$id"
                  params={{ id: p.habit.id }}
                  className="flex items-center gap-3 rounded-2xl bg-card p-3"
                >
                  <div
                    className="grid h-10 w-10 place-items-center rounded-full"
                    style={{ backgroundColor: `color-mix(in oklab, ${color} 22%, transparent)` }}
                  >
                    <HabitIcon name={p.habit.icon} size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{p.habit.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.this}/{p.dueThis} this week · last week {p.last}
                    </div>
                  </div>
                  <span
                    className="text-xs font-semibold"
                    style={{
                      color: diff > 0 ? color : diff < 0 ? "var(--destructive)" : "var(--muted-foreground)",
                    }}
                  >
                    {diff > 0 ? "+" : ""}{diff}
                  </span>
                </Link>
              );
            })}
          </ul>
        )}
      </section>
    </AppShell>
  );
}

function Delta({ delta }: { delta: number }) {
  const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const color = delta > 0 ? "var(--primary)" : delta < 0 ? "var(--destructive)" : "var(--muted-foreground)";
  return (
    <div
      className="flex items-center gap-1.5 rounded-full bg-background px-3 py-2 text-sm font-semibold"
      style={{ color }}
    >
      <Icon size={16} />
      {delta > 0 ? "+" : ""}{delta} pts
    </div>
  );
}

function Mini({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-background p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
      <div className="text-[10px] text-muted-foreground">{sub}</div>
    </div>
  );
}