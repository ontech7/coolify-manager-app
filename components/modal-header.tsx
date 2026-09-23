import { IconButton } from "@/components/ui/icon-button";
import { Text } from "@/components/ui/text";
import { colors, spacing } from "@/theme";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ModalHeaderProps {
  title: string;
  onClose: () => void;
  /** Extra actions, shown before the close button. */
  children?: ReactNode;
}

/** Header shared by the modal screens: title, actions and a close button. */
export function ModalHeader({ title, onClose, children }: ModalHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
      <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.actions}>
        {children}
        <IconButton
          name="close"
          size={24}
          onPress={onClose}
          // 24pt icon: widen the target to ~44pt.
          hitSlop={spacing.lg}
          accessibilityLabel="Close"
        />
      </View>
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
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    marginRight: spacing.lg,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
});
