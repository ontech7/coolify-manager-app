import { CoolifyApiProvider } from "@/providers/coolify-api-provider";
import { colors as themeColors } from "@/theme/colors";
import { useTheme } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const { colors } = useTheme();
  colors.background = themeColors.background.primary;

  return (
    <CoolifyApiProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="application/[uuid]/index"
          options={{
            presentation: "transparentModal",
            animation: "fade_from_bottom",
          }}
        />
        <Stack.Screen
          name="application/[uuid]/logs"
          options={{
            presentation: "transparentModal",
            animation: "fade_from_bottom",
          }}
        />
        <Stack.Screen
          name="deployment/[uuid]"
          options={{
            presentation: "transparentModal",
            animation: "fade_from_bottom",
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </CoolifyApiProvider>
  );
}
