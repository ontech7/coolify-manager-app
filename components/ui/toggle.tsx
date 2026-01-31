import { triggerHaptic } from "@/hooks/useHaptics";
import { colors, radius } from "@/theme";
import { useCallback } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

const TRACK_WIDTH = 44;
const TRACK_HEIGHT = 24;
const THUMB_SIZE = 20;
const THUMB_MARGIN = 2;

export function Toggle({ value, onValueChange, disabled }: ToggleProps) {
  const position = useSharedValue(value ? 1 : 0);

  const handlePress = useCallback(() => {
    if (!disabled) {
      triggerHaptic("selection");
      const newValue = !value;
      position.value = withTiming(newValue ? 1 : 0, { duration: 200 });
      onValueChange(newValue);
    }
  }, [disabled, value, position, onValueChange]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      position.value,
      [0, 1],
      [colors.surface.hover, colors.primary.default],
    ),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withTiming(
          position.value * (TRACK_WIDTH - THUMB_SIZE - THUMB_MARGIN * 2),
          { duration: 200 },
        ),
      },
    ],
  }));

  return (
    <Pressable onPress={handlePress} disabled={disabled}>
      <Animated.View
        style={[styles.track, trackStyle, disabled && styles.disabled]}
      >
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: radius.full,
    padding: THUMB_MARGIN,
    justifyContent: "center",
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.text.primary,
  },
  disabled: {
    opacity: 0.4,
  },
});
