import { HapticTab } from "@/components/haptic-tab";
import { colors } from "@/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary.light,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarStyle: {
          backgroundColor: colors.background.primary,
          borderTopColor: colors.surface.border,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Applications",
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={24} name="layers" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="deployments"
        options={{
          title: "Deployments",
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={24} name="rocket" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={24} name="settings" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
