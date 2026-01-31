import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { Platform } from "react-native";

type HapticType =
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "warning"
  | "error"
  | "selection";

const hapticMap: Record<HapticType, () => Promise<void>> = {
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  success: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  selection: () => Haptics.selectionAsync(),
};

export function useHaptics() {
  const trigger = useCallback(async (type: HapticType = "light") => {
    if (Platform.OS === "web") return;

    try {
      await hapticMap[type]();
    } catch {}
  }, []);

  return { trigger };
}

export async function triggerHaptic(type: HapticType = "light"): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    await hapticMap[type]();
  } catch {}
}
