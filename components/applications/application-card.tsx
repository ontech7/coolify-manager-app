import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Text } from "@/components/ui/text";
import { colors, spacing } from "@/theme";
import type { ApplicationResponse } from "@/types/api";
import { getApplicationStatus } from "@/utils/status";
import { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ApplicationActions } from "./application-actions";

interface ApplicationCardProps {
  application: ApplicationResponse;
  onPress: (uuid: string) => void;
  onDeploy: (uuid: string) => Promise<void>;
  onRestart: (uuid: string) => Promise<void>;
  onStart: (uuid: string) => Promise<void>;
  onStop: (uuid: string) => Promise<void>;
  onViewLogs: (uuid: string) => void;
}

export function ApplicationCard({
  application,
  onPress,
  onDeploy,
  onRestart,
  onStart,
  onStop,
  onViewLogs,
}: ApplicationCardProps) {
  const status = getApplicationStatus(application);

  const handlePress = useCallback(() => {
    onPress(application.uuid);
  }, [onPress, application.uuid]);

  return (
    <Card style={{ marginBottom: spacing.lg }}>
      <View style={styles.header}>
        <View style={styles.info}>
          <Pressable onPress={handlePress}>
            <Text style={styles.name} numberOfLines={1}>
              {application.name}
            </Text>
          </Pressable>
          <Text style={styles.type} numberOfLines={1}>
            {application.build_pack || application.type}
          </Text>
        </View>
        <StatusBadge status={status} />
      </View>

      <ApplicationActions
        application={application}
        onDeploy={onDeploy}
        onRestart={onRestart}
        onStart={onStart}
        onStop={onStop}
        onViewLogs={onViewLogs}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },
  info: {
    flex: 1,
    marginRight: spacing.lg,
  },
  name: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text.primary,
  },
  type: {
    fontSize: 11,
    color: colors.text.disabled,
    marginTop: 2,
  },
});
