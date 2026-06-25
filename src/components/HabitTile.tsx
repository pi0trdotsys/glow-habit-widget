import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
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

export function HabitTile({ habit, compact = false }: Props) {
  const navigate = useNavigate();
  const toggleCompletion = useHabits((s) => s.toggleCompletion);
  const completions = useHabits((s) => s.completions);
  const done = useHabits((s) => s.isCompleted(habit.id));
  const streak = currentStreak(habit, completions);
  const color = HABIT_COLOR_VAR[habit.color];

  const { handlers, progress, isHolding } = useHoldToComplete({
    duration: 600,
    onComplete: () => toggleCompletion(habit.id),
    onTap: () => {
      if (!compact) navigate({ to: "/habits/$id", params: { id: habit.id } });
    },
  });

  // Ring math
  const size = compact ? 88 : 116;
  const stroke = compact ? 6 : 8;
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
        animate={{ scale: isHolding ? 0.96 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
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
            size={compact ? 26 : 34}
            strokeWidth={1.8}
            className="text-foreground"
          />
        </motion.div>

        {done && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full text-xs font-bold"
            style={{ backgroundColor: color, color: "var(--background)" }}
          >
            ✓
          </motion.span>
        )}
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