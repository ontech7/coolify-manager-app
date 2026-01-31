import { Text } from "@/components/ui/text";
import { colors, radius, spacing } from "@/theme";
import { StyleSheet, View } from "react-native";

interface DetailRowProps {
  label: string;
  value?: string | null;
  mono?: boolean;
  children?: React.ReactNode;
}

export function DetailRow({ label, value, mono, children }: DetailRowProps) {
  if (!value && !children) return null;

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {children || (
        <Text
          style={[styles.value, mono && styles.monoValue]}
          numberOfLines={2}
        >
          {value}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
  },
  label: {
    width: 100,
    fontSize: 13,
    color: colors.text.disabled,
  },
  value: {
    flex: 1,
    fontSize: 13,
    color: colors.text.secondary,
  },
  monoValue: {
    flex: 0,
    fontFamily: "monospace",
    fontSize: 11,
    backgroundColor: colors.surface.hover,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    color: colors.primary.light,
  },
});
