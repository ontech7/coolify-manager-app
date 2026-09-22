import { Text } from "@/components/ui/text";
import { colors, motion } from "@/theme";
import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { useEffect } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

/** Height of an item; the tab bar's active pill has the same height. */
export const TAB_ITEM_HEIGHT = 46;

const ICON_SIZE = 20;

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
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 1.08]) }],
  }));

  // White on the solid pill, muted elsewhere.
  const color = focused ? colors.text.primary : colors.text.muted;

  return (
    <Pressable
      style={styles.item}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
    >
      <Animated.View style={iconStyle}>
        {icon?.({ focused, color, size: ICON_SIZE })}
      </Animated.View>
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
    height: TAB_ITEM_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: "500",
  },
  labelFocused: {
    fontWeight: "600",
  },
});
