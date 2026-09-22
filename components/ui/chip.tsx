import { colors, radius, spacing } from "@/theme";
import { Pressable, StyleSheet } from "react-native";
import { Text } from "./text";

interface ChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

/** Rounded selectable pill (filters, container pickers). */
export function Chip({ label, active, onPress }: ChipProps) {
  return (
    <Pressable
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      hitSlop={{ top: spacing.md, bottom: spacing.md }}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text
        style={[styles.text, active && styles.textActive]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.surface.default,
  },
  chipActive: {
    backgroundColor: colors.primary.background,
  },
  text: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.text.muted,
  },
  textActive: {
    color: colors.primary.light,
  },
});
