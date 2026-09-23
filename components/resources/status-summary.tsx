import { Text } from "@/components/ui/text";
import { colors, radius, spacing } from "@/theme";
import type { Resource } from "@/types/api";
import { summarizeStatuses } from "@/utils/status";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

interface StatusSummaryProps {
  resources: Resource[];
}

/** "● 12 running ● 1 unhealthy ● 2 stopped" — only non-zero counts. */
export function StatusSummary({ resources }: StatusSummaryProps) {
  const items = useMemo(() => {
    const summary = summarizeStatuses(resources);
    return [
      {
        key: "running",
        count: summary.running,
        color: colors.status.success,
      },
      {
        key: "unhealthy",
        count: summary.unhealthy,
        color: colors.status.warning,
      },
      { key: "stopped", count: summary.stopped, color: colors.status.error },
    ].filter((item) => item.count > 0);
  }, [resources]);

  if (items.length === 0) {
    return <Text style={styles.text}>Apps, databases & services</Text>;
  }

  return (
    <View style={styles.row}>
      {items.map((item) => (
        <View key={item.key} style={styles.item}>
          <View style={[styles.dot, { backgroundColor: item.color }]} />
          <Text style={styles.text}>
            {item.count} {item.key}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: spacing.md,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
  },
  text: {
    fontSize: 12,
    color: colors.text.muted,
  },
});
