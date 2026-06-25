import type { HabitColor } from "./types";

export const HABIT_COLOR_VAR: Record<HabitColor, string> = {
  mint: "var(--habit-mint)",
  coral: "var(--habit-coral)",
  amber: "var(--habit-amber)",
  violet: "var(--habit-violet)",
  sky: "var(--habit-sky)",
  rose: "var(--habit-rose)",
  lime: "var(--habit-lime)",
  sand: "var(--habit-sand)",
};

export const HABIT_COLORS: HabitColor[] = [
  "mint",
  "coral",
  "amber",
  "violet",
  "sky",
  "rose",
  "lime",
  "sand",
];

export const HABIT_ICONS = [
  "Droplet",
  "Activity",
  "BookOpen",
  "Sparkles",
  "Apple",
  "Dumbbell",
  "Brain",
  "Footprints",
  "Bike",
  "Heart",
  "Moon",
  "Sun",
  "Coffee",
  "Leaf",
  "Music",
  "PenLine",
  "Phone",
  "Pill",
  "Smile",
  "Bed",
] as const;

export type HabitIconName = (typeof HABIT_ICONS)[number];