import { AnimatedTabBar } from "@/components/navigation/animated-tab-bar";
import { colors, motion } from "@/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type {
  BottomTabBarProps,
  BottomTabNavigationOptions,
} from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import { Easing } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

const renderTabBar = (props: BottomTabBarProps) => (
  <AnimatedTabBar {...props} />
);

/**
 * Cross-fade with a short horizontal shift toward the tab's side. Driven by
 * the native driver, so it costs nothing on the JS thread.
 */
const tabTransition: BottomTabNavigationOptions = {
  transitionSpec: {
    animation: "timing",
    config: {
      duration: motion.duration.normal,
      easing: Easing.out(Easing.cubic),
    },
  },
  sceneStyleInterpolator: ({ current }) => ({
    sceneStyle: {
      opacity: current.progress.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [0, 1, 0],
      }),
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [-24, 0, 24],
          }),
        },
      ],
    },
  }),
};

export default function TabLayout() {
  const reduceMotion = useReducedMotion();

  return (
    <Tabs
      tabBar={renderTabBar}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background.primary },
        ...(reduceMotion ? null : tabTransition),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Resources",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons size={size} name="layers" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="deployments"
        options={{
          title: "Deployments",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons size={size} name="rocket" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="servers"
        options={{
          title: "Servers",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons size={size} name="dns" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons size={size} name="settings" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
