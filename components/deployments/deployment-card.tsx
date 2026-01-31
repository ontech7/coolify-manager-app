import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Text } from "@/components/ui/text";
import { colors, radius, spacing } from "@/theme";
import type { DeploymentResponse, DeploymentStatus } from "@/types/api";
import { formatRelativeTime } from "@/utils/date";
import { canCancelDeployment } from "@/utils/status";
import { truncateCommit, truncateMessage } from "@/utils/string";
import { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

interface DeploymentCardProps {
  deployment: DeploymentResponse;
  onPress: (uuid: string) => void;
  onCancel: (uuid: string) => Promise<void>;
}

export function DeploymentCard({
  deployment,
  onPress,
  onCancel,
}: DeploymentCardProps) {
  const [isCancelling, setIsCancelling] = useState(false);

  const canCancel = canCancelDeployment(deployment.status as DeploymentStatus);

  const handlePress = useCallback(() => {
    onPress(deployment.deployment_uuid);
  }, [onPress, deployment.deployment_uuid]);

  const handleCancel = useCallback(() => {
    Alert.alert(
      "Cancel Deployment",
      "Are you sure you want to cancel this deployment?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            setIsCancelling(true);
            try {
              await onCancel(deployment.deployment_uuid);
            } catch (error) {
              Alert.alert(
                "Error",
                error instanceof Error
                  ? error.message
                  : "Failed to cancel deployment",
              );
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ],
    );
  }, [deployment.deployment_uuid, onCancel]);

  return (
    <Card style={{ marginBottom: spacing.lg }}>
      <View style={styles.header}>
        <View style={styles.info}>
          <Pressable onPress={handlePress}>
            <Text style={styles.appName} numberOfLines={1}>
              {deployment.application_name}
            </Text>
          </Pressable>
          <View style={styles.meta}>
            <Text style={styles.date}>
              {formatRelativeTime(deployment.created_at)}
            </Text>
            {deployment.commit && (
              <View style={styles.commitBadge}>
                <Text style={styles.commitText}>
                  {truncateCommit(deployment.commit)}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.actions}>
          {canCancel && (
            <IconButton
              name="cancel"
              color={colors.status.error}
              size={24}
              onPress={handleCancel}
              loading={isCancelling}
              disabled={isCancelling}
            />
          )}
          <StatusBadge status={deployment.status as DeploymentStatus} />
        </View>
      </View>

      {deployment.commit_message && (
        <Text style={styles.message} numberOfLines={1}>
          {truncateMessage(deployment.commit_message, 60)}
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  info: {
    flex: 1,
    marginRight: spacing.lg,
  },
  appName: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text.primary,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  date: {
    fontSize: 11,
    color: colors.text.disabled,
  },
  commitBadge: {
    backgroundColor: colors.surface.hover,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  commitText: {
    fontSize: 10,
    fontFamily: "monospace",
    color: colors.text.muted,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  message: {
    marginTop: spacing.md,
    fontSize: 12,
    color: colors.text.muted,
  },
});
