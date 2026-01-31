import { colors, radius, spacing } from "@/theme";
import { useMemo } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Text } from "./text";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

type StatusType =
  | "running:healthy"
  | "running:unhealthy"
  | "exited:unhealthy"
  | "stopped"
  | "building"
  | "unknown"
  | "success"
  | "failed"
  | "in_progress"
  | "queued"
  | "cancelled";

interface StatusBadgeProps {
  status: StatusType;
  style?: StyleProp<ViewStyle>;
}

const statusConfig: Record<
  StatusType,
  { label: string; color: string; bgColor: string; pulse?: boolean }
> = {
  "running:healthy": {
    label: "Running",
    color: colors.status.success,
    bgColor: colors.status.successBg,
  },
  "running:unhealthy": {
    label: "Running: Unhealthy",
    color: colors.status.warning,
    bgColor: colors.status.warningBg,
  },
  "exited:unhealthy": {
    label: "Exited: Unhealthy",
    color: colors.status.error,
    bgColor: colors.status.errorBg,
  },
  stopped: {
    label: "Stopped",
    color: colors.status.error,
    bgColor: colors.status.errorBg,
  },
  building: {
    label: "Building",
    color: colors.status.warning,
    bgColor: colors.status.warningBg,
    pulse: true,
  },
  unknown: {
    label: "Unknown",
    color: colors.text.muted,
    bgColor: colors.surface.default,
  },
  success: {
    label: "Success",
    color: colors.status.success,
    bgColor: colors.status.successBg,
  },
  failed: {
    label: "Failed",
    color: colors.status.error,
    bgColor: colors.status.errorBg,
  },
  in_progress: {
    label: "In Progress",
    color: colors.status.warning,
    bgColor: colors.status.warningBg,
    pulse: true,
  },
  queued: {
    label: "Queued",
    color: colors.primary.light,
    bgColor: colors.primary.background,
  },
  cancelled: {
    label: "Cancelled",
    color: colors.text.muted,
    bgColor: colors.surface.default,
  },
};

export function StatusBadge({ status, style }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.unknown;
  const opacity = useSharedValue(1);

  if (config.pulse) {
    opacity.value = withRepeat(withTiming(0.4, { duration: 750 }), -1, true);
  }

  const animatedDotStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const containerStyle = useMemo(
    () => [styles.container, { backgroundColor: config.bgColor }, style],
    [config.bgColor, style],
  );

  const dotStyle = useMemo(
    () => [styles.dot, { backgroundColor: config.color }],
    [config.color],
  );

  const textStyle = useMemo(
    () => [styles.text, { color: config.color }],
    [config.color],
  );

  return (
    <View style={containerStyle}>
      <Animated.View style={[dotStyle, config.pulse && animatedDotStyle]} />
      <Text style={textStyle}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  text: {
    fontSize: 11,
    fontWeight: "500",
  },
});
