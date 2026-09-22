import { Text } from "@/components/ui/text";
import { colors, spacing } from "@/theme";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface TabHeaderProps {
  title: string;
  /** A plain string, or a custom element (e.g. a status summary). */
  subtitle?: ReactNode;
  /** Right-side actions, aligned with the title. */
  children?: ReactNode;
}

/**
 * Large-title header shared by the list tabs. The subtitle spans the full
 * width under the title row, so a status summary doesn't wrap on small phones.
 */
export function TabHeader({ title, subtitle, children }: TabHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.xl }]}>
      <View style={styles.titleRow}>
        <Text
          style={styles.title}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          accessibilityRole="header"
        >
          {title}
        </Text>
        {children ? <View style={styles.actions}>{children}</View> : null}
      </View>
      {typeof subtitle === "string" ? (
        <Text style={styles.subtitle}>{subtitle}</Text>
      ) : (
        subtitle
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.lg,
  },
  title: {
    flexShrink: 1,
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
