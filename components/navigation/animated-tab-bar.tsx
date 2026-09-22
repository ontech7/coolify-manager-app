import { triggerHaptic } from "@/lib/haptics";
import { colors, motion, radius, spacing } from "@/theme";
import {
  BottomTabBarHeightCallbackContext,
  type BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import {
  Keyboard,
  Platform,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { TAB_ITEM_HEIGHT, TabBarItem } from "./tab-bar-item";

const BAR_PADDING = spacing.md;
const BAR_BORDER = 1;
const BAR_MAX_WIDTH = 480;
const TAB_BAR_HEIGHT = TAB_ITEM_HEIGHT + (BAR_PADDING + BAR_BORDER) * 2;

/**
 * Floating capsule tab bar with a solid pill that slides to the focused tab.
 * The pill runs on the UI thread (Reanimated), so switching tabs stays at
 * 60fps while the new screen renders. Screens read the space it covers with
 * `useBottomTabBarHeight()` to pad their content.
 */
export function AnimatedTabBar({
  state,
  descriptors,
  navigation,
  insets,
}: BottomTabBarProps) {
  const [width, setWidth] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const position = useSharedValue(state.index);
  const onHeightChange = useContext(BottomTabBarHeightCallbackContext);

  const tabWidth = width / state.routes.length;
  // Float just above the home indicator / system navigation bar.
  const bottom = insets.bottom > 0 ? insets.bottom + spacing.sm : spacing.xl;

  useEffect(() => {
    position.value = withSpring(state.index, motion.spring.snappy);
  }, [state.index, position]);

  // Before paint, so screens don't first render with the default height.
  useLayoutEffect(() => {
    onHeightChange?.(TAB_BAR_HEIGHT + bottom);
  }, [onHeightChange, bottom]);

  // Android resizes the window for the keyboard, which would float the bar
  // above it and over inputs: hide it meanwhile (like tabBarHideOnKeyboard).
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const show = Keyboard.addListener("keyboardDidShow", () =>
      setIsKeyboardVisible(true),
    );
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setIsKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: position.value * tabWidth }],
  }));

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  }, []);

  if (isKeyboardVisible) return null;

  return (
    <View style={[styles.wrapper, { bottom }]}>
      <View style={styles.bar}>
        <View
          style={styles.items}
          onLayout={handleLayout}
          accessibilityRole="tablist"
        >
          {width > 0 ? (
            <Animated.View
              style={[styles.indicator, { width: tabWidth }, indicatorStyle]}
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    pointerEvents: "box-none",
  },
  bar: {
    width: "100%",
    maxWidth: BAR_MAX_WIDTH,
    height: TAB_BAR_HEIGHT,
    padding: BAR_PADDING,
    borderRadius: radius.full,
    borderWidth: BAR_BORDER,
    borderColor: colors.primary.border,
    backgroundColor: colors.background.elevated,
    boxShadow: `0 12px 32px ${colors.shadow}, 0 0 24px ${colors.primary.glow}`,
  },
  items: {
    flex: 1,
    flexDirection: "row",
  },
  indicator: {
    position: "absolute",
    top: 0,
    left: 0,
    height: TAB_ITEM_HEIGHT,
    borderRadius: radius.full,
    // Darker violet keeps white 10px labels above 4.5:1 contrast.
    backgroundColor: colors.primary.hover,
    pointerEvents: "none",
  },
});
