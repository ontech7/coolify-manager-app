import { triggerHaptic } from "@/lib/haptics";
import { colors, radius, spacing } from "@/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useCallback, useEffect } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Text } from "./text";

interface AutoRefreshButtonProps {
  enabled: boolean;
  onToggle: () => void;
  label?: string;
}

/** "Auto" pill with a spinning sync icon while auto-refresh is on. */
export function AutoRefreshButton({
  enabled,
  onToggle,
  label = "Auto",
}: AutoRefreshButtonProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (enabled) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      cancelAnimation(rotation);
      rotation.value = 0;
    }
  }, [enabled, rotation]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const handlePress = useCallback(() => {
    triggerHaptic("selection");
    onToggle();
  }, [onToggle]);

  return (
    <Pressable
      style={[styles.button, enabled && styles.buttonActive]}
      onPress={handlePress}
      hitSlop={spacing.md}
      accessibilityRole="switch"
      accessibilityState={{ checked: enabled }}
      accessibilityLabel={`${label} refresh`}
    >
      <Animated.View style={iconStyle}>
        <MaterialIcons
          name="sync"
          size={14}
          color={enabled ? colors.primary.default : colors.text.muted}
        />
      </Animated.View>
      <Text style={[styles.text, enabled && styles.textActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.surface.default,
  },
  buttonActive: {
    backgroundColor: colors.primary.background,
  },
  text: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.text.muted,
  },
  textActive: {
    color: colors.primary.default,
  },
});
