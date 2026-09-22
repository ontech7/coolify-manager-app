import { colors, motion, radius, spacing } from "@/theme";
import { useCallback, type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Card({ children, onPress, style }: CardProps) {
  if (onPress) {
    return (
      <PressableCard onPress={onPress} style={style}>
        {children}
      </PressableCard>
    );
  }

  return <View style={[styles.card, style]}>{children}</View>;
}

/**
 * Shrinks slightly and highlights its border while pressed (UI thread).
 * Not a single accessibility element, so screen readers can still reach the
 * buttons inside it; cards expose their open action on their title instead.
 */
function PressableCard({
  children,
  onPress,
  style,
}: CardProps & { onPress: () => void }) {
  const pressed = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    pressed.value = withSpring(1, motion.spring.press);
  }, [pressed]);

  const handlePressOut = useCallback(() => {
    pressed.value = withSpring(0, motion.spring.press);
  }, [pressed]);

  const pressedStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      pressed.value,
      [0, 1],
      [colors.surface.border, colors.surface.borderHover],
    ),
    transform: [
      { scale: interpolate(pressed.value, [0, 1], [1, motion.pressScale]) },
    ],
  }));

  return (
    <AnimatedPressable
      style={[styles.card, style, pressedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      // Skip the press feedback when the touch turns into a scroll.
      unstable_pressDelay={motion.pressDelay}
      accessible={false}
    >
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.default,
    borderWidth: 1,
    borderColor: colors.surface.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
});
