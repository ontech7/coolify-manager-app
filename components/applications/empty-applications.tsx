import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { colors, spacing } from "@/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, View } from "react-native";

interface EmptyApplicationsProps {
  isConfigured: boolean;
  onGoToSettings: () => void;
  onRefresh: () => void;
}

export function EmptyApplications({
  isConfigured,
  onGoToSettings,
  onRefresh,
}: EmptyApplicationsProps) {
  return !isConfigured ? (
    <View style={styles.container}>
      <MaterialIcons
        name="settings"
        size={48}
        color={colors.primary.default}
        style={styles.icon}
      />
      <Text style={styles.title}>Not Configured</Text>
      <Text style={styles.message}>
        Please configure your Coolify server connection in Settings to get
        started.
      </Text>
      <Button
        title="Go to Settings"
        onPress={onGoToSettings}
        style={styles.button}
      />
    </View>
  ) : (
    <View style={styles.container}>
      <MaterialIcons
        name="layers"
        size={48}
        color={colors.primary.default}
        style={styles.icon}
      />
      <Text style={styles.title}>No Applications</Text>
      <Text style={styles.message}>
        No applications found on your Coolify server.
      </Text>
      <Button
        title="Refresh"
        variant="secondary"
        onPress={onRefresh}
        style={styles.button}
      />
    </View>
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
