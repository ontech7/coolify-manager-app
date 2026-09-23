import { Text } from "@/components/ui/text";
import { triggerHaptic } from "@/lib/haptics";
import { colors, radius, spacing } from "@/theme";
import { MaterialIcons } from "@react-native-vector-icons/material-icons";
import { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";

interface RefreshErrorBannerProps {
  message: string;
  onRetry: () => void;
}

/**
 * Inline warning for a failed refresh while older data is still listed, so
 * the list and header counts aren't mistaken for the current state.
 */
export function RefreshErrorBanner({
  message,
  onRetry,
}: RefreshErrorBannerProps) {
  const handleRetry = useCallback(() => {
    triggerHaptic("light");
    onRetry();
  }, [onRetry]);

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <MaterialIcons name="warning" size={16} color={colors.status.warning} />
      <Text style={styles.message} numberOfLines={2}>
        Couldn&apos;t refresh: {message}
      </Text>
      <Pressable
        onPress={handleRetry}
        hitSlop={spacing.lg}
        accessibilityRole="button"
        accessibilityLabel="Retry refresh"
      >
        {({ pressed }) => (
          <Text style={[styles.retry, pressed && styles.retryPressed]}>
            Retry
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.status.warningBg,
  },
  message: {
    flex: 1,
    fontSize: 12,
    color: colors.text.secondary,
  },
  retry: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.status.warning,
  },
  retryPressed: {
    opacity: 0.7,
  },
});
