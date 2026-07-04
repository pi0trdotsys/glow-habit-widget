export type HabitScheduleType = "daily" | "weekdays" | "timesPerWeek";

export interface HabitSchedule {
  type: HabitScheduleType;
  /** 0 = Sunday, 1 = Monday, ... 6 = Saturday. Used when type === "weekdays". */
  days?: number[];
  /** Number of completions per week. Used when type === "timesPerWeek". */
  target?: number;
}

export type HabitColor =
  | "mint"
  | "coral"
  | "amber"
  | "violet"
  | "sky"
  | "rose"
  | "lime"
  | "sand";

export interface Habit {
  id: string;
  name: string;
  icon: string; // lucide icon name
  color: HabitColor;
  schedule: HabitSchedule;
  createdAt: string; // ISO
  /** Optional per-habit reminder time, "HH:mm" local. Undefined = no reminder. */
  reminder?: string | null;
}

export interface Completion {
  habitId: string;
  /** YYYY-MM-DD in local time */
  date: string;
}