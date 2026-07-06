import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { HabitIcon } from "./HabitIcon";
import { useHoldToComplete } from "@/hooks/useHoldToComplete";
import { useHabits } from "@/lib/habits/store";
import type { Habit } from "@/lib/habits/types";
import { HABIT_COLOR_VAR } from "@/lib/habits/colors";
import { currentStreak } from "@/lib/habits/utils";

interface Props {
  habit: Habit;
  compact?: boolean;
}

const CELEBRATE_EMOJI = ["🎉", "✨", "💪", "🔥", "🌟", "🙌"];
const DONE_EMOJI = ["🎉", "🔥", "💪", "🌟", "✅", "🙌", "⭐"];

export function HabitTile({ habit, compact = false }: Props) {
  const navigate = useNavigate();
  const toggleCompletion = useHabits((s) => s.toggleCompletion);
  const completions = useHabits((s) => s.completions);
  const done = useHabits((s) => s.isCompleted(habit.id));
  const streak = currentStreak(habit, completions);
  const color = HABIT_COLOR_VAR[habit.color];
  const [celebrate, setCelebrate] = useState(false);

  const { handlers, progress, isHolding } = useHoldToComplete({
    duration: 600,
    onComplete: () => {
      const wasDone = done;
      toggleCompletion(habit.id);
      if (!wasDone) {
        setCelebrate(true);
        setTimeout(() => setCelebrate(false), 1100);
        const emoji = DONE_EMOJI[Math.floor(Math.random() * DONE_EMOJI.length)];
        toast(`${emoji} Nice! ${habit.name} done`, {
          action: { label: "Undo", onClick: () => toggleCompletion(habit.id) },
          duration: 3000,
        });
      } else {
        toast(`↩️ Undone: ${habit.name}`, {
          action: { label: "Redo", onClick: () => toggleCompletion(habit.id) },
          duration: 3000,
        });
      }
    },
    onTap: () => {
      if (!compact) navigate({ to: "/habits/$id", params: { id: habit.id } });
    },
  });

  // Ring math
  const size = compact ? 68 : 116;
  const stroke = compact ? 5 : 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ringProgress = done ? 1 : progress;

  return (
    <div
      className="relative flex flex-col items-center gap-2 select-none touch-none"
      style={{ WebkitTouchCallout: "none" }}
    >
      <motion.div
        {...handlers}
        animate={{ scale: isHolding ? 0.96 : celebrate ? [1, 1.12, 1] : 1 }}
        transition={
          celebrate
            ? { duration: 0.5, ease: "easeOut" }
            : { type: "spring", stiffness: 400, damping: 28 }
        }
        className="relative grid place-items-center rounded-full cursor-pointer"
        style={{ width: size, height: size }}
      >
        {/* base track */}
        <svg
          width={size}
          height={size}
          className="absolute inset-0 -rotate-90"
          aria-hidden
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="var(--border)"
            strokeWidth={stroke}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - ringProgress)}
            style={{ transition: isHolding ? "none" : "stroke-dashoffset 250ms ease-out" }}
          />
        </svg>

        {/* inner disc */}
        <motion.div
          animate={{
            backgroundColor: done
              ? `color-mix(in oklab, ${color} 22%, transparent)`
              : "var(--card)",
          }}
          className="grid place-items-center rounded-full"
          style={{
            width: size - stroke * 2 - 6,
            height: size - stroke * 2 - 6,
          }}
        >
          <HabitIcon
            name={habit.icon}
            size={compact ? 22 : 34}
            strokeWidth={1.8}
            className="text-foreground"
          />
        </motion.div>

        {done && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 18 }}
            className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full text-xs font-bold"
            style={{ backgroundColor: color, color: "var(--background)" }}
          >
            ✓
          </motion.span>
        )}

        {celebrate && <Celebration />}
      </motion.div>

      <div className="text-center">
        <div className={`font-medium leading-tight ${compact ? "text-xs" : "text-sm"}`}>
          {habit.name}
        </div>
        {!compact && (
          <div className="mt-0.5 text-xs text-muted-foreground">
            {streak > 0 ? `🔥 ${streak} day${streak === 1 ? "" : "s"}` : "Hold to complete"}
          </div>
        )}
      </div>
    </div>
  );
}

/** A short burst of emoji flying outward when a habit is completed. */
function Celebration() {
  const dist = 46;
  return (
    <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center">
      <motion.span
        className="absolute text-3xl"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.5, 1.1], opacity: [0, 1, 0] }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      >
        🎉
      </motion.span>
      {CELEBRATE_EMOJI.map((e, i) => {
        const ang = (i / CELEBRATE_EMOJI.length) * 2 * Math.PI - Math.PI / 2;
        return (
          <motion.span
            key={i}
            className="absolute text-lg"
            initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
            animate={{
              x: Math.cos(ang) * dist,
              y: Math.sin(ang) * dist,
              scale: [0, 1.15, 0.9],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 0.9, ease: "easeOut", delay: i * 0.02 }}
          >
            {e}
          </motion.span>
        );
      })}
    </div>
  );
}
