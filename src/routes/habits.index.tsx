import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { HabitTile } from "@/components/HabitTile";
import { useHabits } from "@/lib/habits/store";

export const Route = createFileRoute("/habits/")({
  head: () => ({
    meta: [
      { title: "Habits — Loop" },
      { name: "description", content: "All your habits in one place." },
    ],
  }),
  component: HabitsPage,
});

function HabitsPage() {
  const habits = useHabits((s) => s.habits);
  return (
    <AppShell>
      <header className="flex items-end justify-between px-5 pt-10 pb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {habits.length}/24
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Habits</h1>
        </div>
        <Link
          to="/habits/new"
          className="grid h-11 w-11 place-items-center rounded-full"
          style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
          aria-label="Add habit"
        >
          <Plus size={20} strokeWidth={2.4} />
        </Link>
      </header>

      {habits.length === 0 ? (
        <p className="px-5 text-sm text-muted-foreground">No habits yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-y-7 gap-x-2 px-5">
          {habits.map((h) => (
            <HabitTile key={h.id} habit={h} />
          ))}
        </div>
      )}
    </AppShell>
  );
}