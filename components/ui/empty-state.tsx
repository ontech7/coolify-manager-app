import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { colors, spacing } from "@/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, View } from "react-native";

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>["name"];
type EmptyStateActionVariant = "primary" | "secondary";

interface EmptyStateProps {
  icon: MaterialIconName;
  title: string;
  message: string;
  actionLabel?: string;
  actionVariant?: EmptyStateActionVariant;
  onAction?: () => void;
}

/**
 * Shared empty/placeholder state used across list screens. Centralizing it
 * keeps the layout (icon size, spacing, centering) identical everywhere, so
 * screens with matching headers center the content at the exact same point.
 */
export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  actionVariant = "secondary",
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <MaterialIcons
        name={icon}
        size={48}
        color={colors.primary.default}
        style={styles.icon}
      />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <Button
          title={actionLabel}
          variant={actionVariant}
          onPress={onAction}
          style={styles.button}
        />
      ) : null}
    </View>
  );
}

/**
 * The "no instance configured" state. Identical wording on every screen so the
 * placeholder doesn't shift between tabs.
 */
export function NotConfiguredEmptyState({
  onGoToSettings,
}: {
  onGoToSettings: () => void;
}) {
  return (
    <EmptyState
      icon="settings"
      title="Not Configured"
      message="Please configure your Coolify server connection in Settings to get started."
      actionLabel="Go to Settings"
      actionVariant="primary"
      onAction={onGoToSettings}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing["3xl"],
  },
  icon: {
    marginBottom: spacing.xl,
    opacity: 0.8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  message: {
    fontSize: 14,
    color: colors.text.muted,
    textAlign: "center",
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  button: {
    minWidth: 160,
  },
});
