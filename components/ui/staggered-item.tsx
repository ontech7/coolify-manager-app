import { motion } from "@/theme";
import type { ReactNode } from "react";
import Animated, { FadeInDown } from "react-native-reanimated";

interface StaggeredItemProps {
  index: number;
  /**
   * Whether to animate on mount (default true). In a recycling list, pass
   * false after the first load: later mounts are a mix of recycled and new
   * cells, and only the new ones would animate.
   */
  animate?: boolean;
  children: ReactNode;
}

/**
 * List item that fades/slides in with a small per-index delay when it mounts.
 * Only the first few items animate (the ones visible on screen); the rest
 * appear instantly. Honors the system "reduce motion" setting.
 */
export function StaggeredItem({
  index,
  animate = true,
  children,
}: StaggeredItemProps) {
  const entering =
    animate && index < motion.staggerMaxItems
      ? FadeInDown.delay(index * motion.stagger).duration(motion.duration.slow)
      : undefined;

  return <Animated.View entering={entering}>{children}</Animated.View>;
}
