import { Text } from "@/components/ui/text";
import { colors, radius, spacing } from "@/theme";
import { StyleSheet, View } from "react-native";

interface HealthPillProps {
  ok: boolean;
  label: string;
}

export function HealthPill({ ok, label }: HealthPillProps) {
  const color = ok ? colors.status.success : colors.status.error;
  const bg = ok ? colors.status.successBg : colors.status.errorBg;

  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  text: {
    fontSize: 11,
    fontWeight: "500",
  },
});
