import { triggerHaptic } from "@/hooks/useHaptics";
import { colors, radius } from "@/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
  type ViewStyle,
} from "react-native";

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>["name"];

type IconButtonVariant =
  | "default"
  | "deploy"
  | "restart"
  | "start"
  | "stop"
  | "ghost";

interface IconButtonProps {
  name: MaterialIconName;
  size?: number;
  color?: string;
  variant?: IconButtonVariant;
  onPress?: PressableProps["onPress"];
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  hitSlop?: PressableProps["hitSlop"];
}

const variantColors: Record<
  IconButtonVariant,
  { color: string; pressedBg: string }
> = {
  default: {
    color: colors.text.muted,
    pressedBg: "rgba(255, 255, 255, 0.15)",
  },
  deploy: {
    color: colors.action.deploy,
    pressedBg: colors.action.deployBg,
  },
  restart: {
    color: colors.action.restart,
    pressedBg: colors.action.restartBg,
  },
  start: {
    color: colors.action.start,
    pressedBg: colors.action.startBg,
  },
  stop: {
    color: colors.action.stop,
    pressedBg: colors.action.stopBg,
  },
  ghost: {
    color: colors.text.primary,
    pressedBg: "transparent",
  },
};

export function IconButton({
  name,
  size = 24,
  color,
  variant = "ghost",
  onPress,
  loading = false,
  disabled = false,
  style,
  hitSlop = 8,
}: IconButtonProps) {
  const handlePress = useCallback(
    (event: Parameters<NonNullable<PressableProps["onPress"]>>[0]) => {
      if (!loading && !disabled && onPress) {
        triggerHaptic("light");
        onPress(event);
      }
    },
    [loading, disabled, onPress],
  );

  const isDisabled = disabled || loading;
  const variantConfig = variantColors[variant];
  const iconColor = color ?? variantConfig.color;

  const containerStyle = useMemo(
    () => [variant !== "ghost" && styles.container, style],
    [variant, style],
  );

  return (
    <Pressable
      style={({ pressed }) => [
        containerStyle,
        pressed && !isDisabled && variant !== "ghost" && styles.pressed,
        pressed &&
          !isDisabled &&
          variant !== "ghost" && { backgroundColor: variantConfig.pressedBg },
        isDisabled && styles.disabled,
      ]}
      onPress={handlePress}
      disabled={isDisabled}
      hitSlop={hitSlop}
    >
      {loading ? (
        <ActivityIndicator size={size * 0.8} color={iconColor} />
      ) : (
        <MaterialIcons name={name} size={size} color={iconColor} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.sm,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  pressed: {
    opacity: 1,
  },
  disabled: {
    opacity: 0.4,
  },
});
