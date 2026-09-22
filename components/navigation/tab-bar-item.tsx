import { Text } from "@/components/ui/text";
import { colors, motion, spacing } from "@/theme";
import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

/** Size of the active pill; the tab bar draws it behind the focused icon. */
export const TAB_INDICATOR_WIDTH = 56;
export const TAB_INDICATOR_HEIGHT = 28;

const ICON_SIZE = 22;

interface TabBarItemProps {
  label: string;
  focused: boolean;
  icon: BottomTabNavigationOptions["tabBarIcon"];
  onPress: () => void;
  onLongPress: () => void;
}

export function TabBarItem({
  label,
  focused,
  icon,
  onPress,
  onLongPress,
}: TabBarItemProps) {
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(focused ? 1 : 0, motion.spring.snappy);
  }, [focused, progress]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 1.1]) }],
  }));

  const color = focused ? colors.primary.light : colors.text.muted;

  return (
    <Pressable
      style={styles.item}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
    >
      <View style={styles.iconSlot}>
        <Animated.View style={iconStyle}>
          {icon?.({ focused, color, size: ICON_SIZE })}
        </Animated.View>
      </View>
      <Text
        style={[styles.label, { color }, focused && styles.labelFocused]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  iconSlot: {
    width: TAB_INDICATOR_WIDTH,
    height: TAB_INDICATOR_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
    paddingHorizontal: spacing.xs,
  },
  labelFocused: {
    fontWeight: "600",
  },
});
