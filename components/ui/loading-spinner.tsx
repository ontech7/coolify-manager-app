import { colors, spacing } from "@/theme";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Text } from "./text";

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message }: LoadingSpinnerProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary.default} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  message: {
    fontSize: 14,
    color: colors.text.muted,
  },
});
