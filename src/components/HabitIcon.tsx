import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Props {
  name: string;
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export function HabitIcon({ name, className, size = 24, strokeWidth = 2 }: Props) {
  const Icon =
    ((LucideIcons as unknown as Record<string, LucideIcon>)[name] as LucideIcon) ??
    LucideIcons.Circle;
  return <Icon className={className} size={size} strokeWidth={strokeWidth} />;
}