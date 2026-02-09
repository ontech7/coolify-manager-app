import { triggerHaptic } from "@/hooks/useHaptics";
import { colors, radius, spacing } from "@/theme";
import { useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Text } from "./text";

type ButtonVariant = "primary" | "secondary" | "danger" | "link";

interface ButtonProps extends Omit<PressableProps, "style"> {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  adornmentStart?: React.ReactNode;
  adornmentEnd?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  variant = "primary",
  loading = false,
  adornmentStart,
  adornmentEnd,
  disabled,
  onPress,
  style,
  ...props
}: ButtonProps) {
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

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !isDisabled && styles[`${variant}Pressed`],
        isDisabled && styles.disabled,
        style,
      ]}
      disabled={isDisabled}
      onPress={handlePress}
      {...props}
    >
      {loading ? (
        <View style={styles.textWrapper}>
          {!adornmentEnd && (
            <ActivityIndicator
              size="small"
              color={
                variant === "primary"
                  ? colors.text.primary
                  : colors.primary.default
              }
            />
          )}
          <Text style={[styles.text, styles[`${variant}Text`]]}>{title}</Text>
          {adornmentEnd && (
            <ActivityIndicator
              size="small"
              color={
                variant === "primary"
                  ? colors.text.primary
                  : colors.primary.default
              }
            />
          )}
        </View>
      ) : (
        <View style={styles.textWrapper}>
          {adornmentStart}
          <Text style={[styles.text, styles[`${variant}Text`]]}>{title}</Text>
          {adornmentEnd}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing["2xl"],
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  primary: {
    backgroundColor: colors.primary.default,
  },
  primaryPressed: {
    backgroundColor: colors.primary.hover,
  },
  primaryText: {
    color: colors.text.primary,
  },
  secondary: {
    backgroundColor: colors.surface.default,
  },
  secondaryPressed: {
    backgroundColor: colors.surface.hover,
  },
  secondaryText: {
    color: colors.text.secondary,
  },
  danger: {
    backgroundColor: colors.status.error,
  },
  dangerPressed: {
    backgroundColor: colors.status.errorHover,
  },
  dangerText: {
    color: colors.text.primary,
  },
  link: {
    backgroundColor: "transparent",
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  linkPressed: {
    opacity: 0.7,
  },
  linkText: {
    color: colors.text.disabled,
    textDecorationLine: "underline",
  },
  textWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  text: {
    fontSize: 13,
    fontWeight: "500",
  },
  disabled: {
    opacity: 0.4,
  },
});
