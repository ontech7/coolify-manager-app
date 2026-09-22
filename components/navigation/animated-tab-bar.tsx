import { triggerHaptic } from "@/hooks/useHaptics";
import { colors, motion, radius, spacing } from "@/theme";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import {
  TAB_INDICATOR_HEIGHT,
  TAB_INDICATOR_WIDTH,
  TabBarItem,
} from "./tab-bar-item";

/**
 * Bottom tab bar with a pill that slides to the focused tab. The pill runs on
 * the UI thread (Reanimated), so switching tabs stays at 60fps even while the
 * new screen renders.
 */
export function AnimatedTabBar({
  state,
  descriptors,
  navigation,
  insets,
}: BottomTabBarProps) {
  const [width, setWidth] = useState(0);
  const position = useSharedValue(state.index);
  const tabWidth = width / state.routes.length;

  useEffect(() => {
    position.value = withSpring(state.index, motion.spring.snappy);
  }, [state.index, position]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          position.value * tabWidth + (tabWidth - TAB_INDICATOR_WIDTH) / 2,
      },
    ],
  }));

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  }, []);

  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: Math.max(insets.bottom, spacing.md) },
      ]}
    >
      <View style={styles.items} onLayout={handleLayout}>
        {width > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.indicator, indicatorStyle]}
          />
        ) : null}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;

          const handlePress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              triggerHaptic("selection");
              navigation.navigate(route.name, route.params);
            }
          };

          const handleLongPress = () => {
            navigation.emit({ type: "tabLongPress", target: route.key });
          };

          return (
            <TabBarItem
              key={route.key}
              label={options.title ?? route.name}
              focused={focused}
              icon={options.tabBarIcon}
              onPress={handlePress}
              onLongPress={handleLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
    paddingTop: spacing.sm,
  },
  items: {
    flexDirection: "row",
  },
  indicator: {
    position: "absolute",
    top: 0,
    left: 0,
    width: TAB_INDICATOR_WIDTH,
    height: TAB_INDICATOR_HEIGHT,
    borderRadius: radius.full,
    backgroundColor: colors.primary.background,
  },
});
