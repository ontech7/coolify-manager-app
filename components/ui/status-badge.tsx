import { colors, radius, spacing } from "@/theme";
import { useEffect, useMemo } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Text } from "./text";

type StatusType =
  | "running:healthy"
  | "running:unhealthy"
  | "exited:unhealthy"
  | "stopped"
  | "building"
  | "deploying"
  | "starting"
  | "stopping"
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
  deploying: {
    label: "Deploying",
    color: colors.status.warning,
    bgColor: colors.status.warningBg,
    pulse: true,
  },
  starting: {
    label: "Starting",
    color: colors.status.warning,
    bgColor: colors.status.warningBg,
    pulse: true,
  },
  stopping: {
    label: "Stopping",
    color: colors.status.error,
    bgColor: colors.status.errorBg,
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

  // Start/stop the pulse only when the status changes. Starting it during
  // render restarted the animation on every list refresh.
  useEffect(() => {
    if (config.pulse) {
      opacity.set(withRepeat(withTiming(0.4, { duration: 750 }), -1, true));
    } else {
      cancelAnimation(opacity);
      opacity.set(1);
    }
  }, [config.pulse, opacity]);

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
      {/* Always attached, so opacity returns to 1 when the pulse stops. */}
      <Animated.View style={[dotStyle, animatedDotStyle]} />
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
