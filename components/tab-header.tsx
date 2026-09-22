import { Text } from "@/components/ui/text";
import { colors, spacing } from "@/theme";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface TabHeaderProps {
  title: string;
  /** A plain string, or a custom element (e.g. a status summary). */
  subtitle?: ReactNode;
  /** Right-side actions. */
  children?: ReactNode;
}

/** Large-title header shared by the list tabs. */
export function TabHeader({ title, subtitle, children }: TabHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.xl }]}>
      <View style={styles.titleGroup}>
        <Text style={styles.title}>{title}</Text>
        {typeof subtitle === "string" ? (
          <Text style={styles.subtitle}>{subtitle}</Text>
        ) : (
          subtitle
        )}
      </View>
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
  },
  titleGroup: {
    flex: 1,
    gap: spacing.xs,
    marginRight: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.text.muted,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
});
