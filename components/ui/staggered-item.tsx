import { motion } from "@/theme";
import type { ReactNode } from "react";
import Animated, { FadeInDown } from "react-native-reanimated";

interface StaggeredItemProps {
  index: number;
  children: ReactNode;
}

/**
 * List item that fades/slides in with a small per-index delay when it mounts.
 * Only the first few items animate (the ones visible on screen); the rest,
 * and recycled list cells, appear instantly. Honors the system
 * "reduce motion" setting.
 */
export function StaggeredItem({ index, children }: StaggeredItemProps) {
  const entering =
    index < motion.staggerMaxItems
      ? FadeInDown.delay(index * motion.stagger).duration(motion.duration.slow)
      : undefined;

  return <Animated.View entering={entering}>{children}</Animated.View>;
}
