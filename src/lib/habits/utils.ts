import { addDays, differenceInCalendarDays, format, parseISO, startOfWeek } from "date-fns";
import type { Completion, Habit } from "./types";

export function todayKey(d: Date = new Date()): string {
  return format(d, "yyyy-MM-dd");
}

export function isDueOn(habit: Habit, date: Date): boolean {
  const s = habit.schedule;
  if (s.type === "daily") return true;
  if (s.type === "weekdays") {
    const days = s.days ?? [1, 2, 3, 4, 5];
    return days.includes(date.getDay());
  }
  // timesPerWeek — always "due" (user picks any day), tile shows weekly target
  return true;
}

export function isCompletedOn(
  habit: Habit,
  completions: Completion[],
  date: Date,
): boolean {
  const key = todayKey(date);
  return completions.some((c) => c.habitId === habit.id && c.date === key);
}

/** Current consecutive-day streak counting today (or yesterday if today not done). */
export function currentStreak(habit: Habit, completions: Completion[]): number {
  const setDates = new Set(
    completions.filter((c) => c.habitId === habit.id).map((c) => c.date),
  );
  let streak = 0;
  let cursor = new Date();
  // Allow grace: if today not done yet but yesterday was, still count from yesterday
  if (!setDates.has(todayKey(cursor))) {
    cursor = addDays(cursor, -1);
    if (!setDates.has(todayKey(cursor))) return 0;
  }
  while (true) {
    if (!isDueOn(habit, cursor)) {
      cursor = addDays(cursor, -1);
      continue;
    }
    if (setDates.has(todayKey(cursor))) {
      streak += 1;
      cursor = addDays(cursor, -1);
    } else {
      break;
    }
  }
  return streak;
}

export function longestStreak(habit: Habit, completions: Completion[]): number {
  const dates = completions
    .filter((c) => c.habitId === habit.id)
    .map((c) => parseISO(c.date))
    .sort((a, b) => a.getTime() - b.getTime());
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const d of dates) {
    if (prev && differenceInCalendarDays(d, prev) === 1) {
      run += 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

/** Completions this calendar week (Mon–Sun). */
export function thisWeekCount(habit: Habit, completions: Completion[]): number {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const startKey = todayKey(start);
  return completions.filter(
    (c) => c.habitId === habit.id && c.date >= startKey,
  ).length;
}

/** Returns last `days` dates with completion booleans for the heatmap. */
export function heatmapData(
  habit: Habit,
  completions: Completion[],
  days = 84,
): { date: string; done: boolean }[] {
  const set = new Set(
    completions.filter((c) => c.habitId === habit.id).map((c) => c.date),
  );
  const out: { date: string; done: boolean }[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(today, -i);
    out.push({ date: todayKey(d), done: set.has(todayKey(d)) });
  }
  return out;
}

/** Completion rate over last N days, considering schedule. */
export function completionRate(
  habit: Habit,
  completions: Completion[],
  days = 30,
): number {
  let due = 0;
  let done = 0;
  const set = new Set(
    completions.filter((c) => c.habitId === habit.id).map((c) => c.date),
  );
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = addDays(today, -i);
    if (!isDueOn(habit, d)) continue;
    due += 1;
    if (set.has(todayKey(d))) done += 1;
  }
  return due === 0 ? 0 : Math.round((done / due) * 100);
}

function countInRange(
  habit: Habit,
  completions: Completion[],
  start: Date,
  end: Date,
): { due: number; done: number } {
  const set = new Set(
    completions.filter((c) => c.habitId === habit.id).map((c) => c.date),
  );
  let due = 0;
  let done = 0;
  let cursor = start;
  while (cursor <= end) {
    if (isDueOn(habit, cursor)) {
      due += 1;
      if (set.has(todayKey(cursor))) done += 1;
    }
    cursor = addDays(cursor, 1);
  }
  return { due, done };
}

export interface WeeklyReport {
  thisWeek: { due: number; done: number; rate: number };
  lastWeek: { due: number; done: number; rate: number };
  delta: number; // percentage points difference
  perHabit: {
    habit: Habit;
    this: number;
    last: number;
    dueThis: number;
  }[];
}

export function weeklyReport(
  habits: Habit[],
  completions: Completion[],
): WeeklyReport {
  const startThis = startOfWeek(new Date(), { weekStartsOn: 1 });
  const endThis = new Date();
  const startLast = addDays(startThis, -7);
  const endLast = addDays(startThis, -1);

  let dueT = 0, doneT = 0, dueL = 0, doneL = 0;
  const perHabit: WeeklyReport["perHabit"] = [];
  for (const h of habits) {
    const t = countInRange(h, completions, startThis, endThis);
    const l = countInRange(h, completions, startLast, endLast);
    dueT += t.due; doneT += t.done;
    dueL += l.due; doneL += l.done;
    perHabit.push({ habit: h, this: t.done, last: l.done, dueThis: t.due });
  }
  const rateT = dueT === 0 ? 0 : Math.round((doneT / dueT) * 100);
  const rateL = dueL === 0 ? 0 : Math.round((doneL / dueL) * 100);
  return {
    thisWeek: { due: dueT, done: doneT, rate: rateT },
    lastWeek: { due: dueL, done: doneL, rate: rateL },
    delta: rateT - rateL,
    perHabit,
  };
}

export function greetingFor(date: Date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  if (h < 22) return "Good evening";
  return "Good night";
}