import { colors, radius, spacing } from "@/theme";
import { useEffect } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

interface SkeletonListProps {
  count?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Placeholder cards shown while a list loads for the first time. They share
 * a single pulsing opacity, so the cost is one animation regardless of count.
 */
export function SkeletonList({ count = 5, style }: SkeletonListProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.set(withRepeat(withTiming(1, { duration: 700 }), -1, true));
    return () => cancelAnimation(opacity);
  }, [opacity]);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[styles.list, style, pulseStyle]}
      accessible
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
    >
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.line, styles.title]} />
            <View style={styles.badge} />
          </View>
          <View style={[styles.line, styles.subtitle]} />
          <View style={styles.row}>
            <View style={styles.actions}>
              <View style={styles.action} />
              <View style={styles.action} />
              <View style={styles.action} />
            </View>
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface.default,
    borderWidth: 1,
    borderColor: colors.surface.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  line: {
    height: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.surface.hover,
  },
  title: {
    width: "45%",
    height: 12,
  },
  subtitle: {
    width: "30%",
  },
  badge: {
    width: 64,
    height: 20,
    borderRadius: radius.sm,
    backgroundColor: colors.surface.hover,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  action: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.surface.hover,
  },
});
