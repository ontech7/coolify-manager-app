import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Text } from "@/components/ui/text";
import { ACTIVATE_ACTION } from "@/constants";
import { colors, radius, spacing } from "@/theme";
import type { Resource, ResourceType } from "@/types/api";
import { getResourceStatus } from "@/utils/status";
import { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ResourceActions } from "./resource-actions";

interface ResourceCardProps {
  resource: Resource;
  supportsResourceLogs: boolean;
  onPress: (resource: Resource) => void;
  onDeploy: (uuid: string, force?: boolean) => Promise<string | undefined>;
  onPullLatest: (uuid: string) => Promise<void>;
  onRestart: (uuid: string, type: ResourceType) => Promise<void>;
  onStart: (uuid: string, type: ResourceType) => Promise<void>;
  onStop: (uuid: string, type: ResourceType) => Promise<void>;
  onViewLogs: (resource: Resource) => void;
  onOpenDeployment: (deploymentUuid: string) => void;
}

const typeChip: Record<ResourceType, { label: string; color: string }> = {
  application: { label: "APP", color: colors.action.deploy },
  database: { label: "DB", color: colors.status.warning },
  service: { label: "SVC", color: colors.status.success },
};

export function ResourceCard({
  resource,
  supportsResourceLogs,
  onPress,
  onDeploy,
  onPullLatest,
  onRestart,
  onStart,
  onStop,
  onViewLogs,
  onOpenDeployment,
}: ResourceCardProps) {
  const { pending } = resource;
  const status = pending ? pending.kind : getResourceStatus(resource.status);
  const chip = typeChip[resource.resourceType];
  const deploymentUuid =
    pending?.kind === "deploying" ? pending.deploymentUuid : undefined;

  const handlePress = useCallback(() => {
    onPress(resource);
  }, [onPress, resource]);

  const handleOpenDeployment = useCallback(() => {
    if (deploymentUuid) onOpenDeployment(deploymentUuid);
  }, [deploymentUuid, onOpenDeployment]);

  return (
    <Card style={styles.card} onPress={handlePress}>
      <View style={styles.header}>
        <View style={styles.info}>
          <Text
            style={styles.name}
            numberOfLines={1}
            accessibilityRole="button"
            accessibilityHint="Opens details"
            accessibilityActions={ACTIVATE_ACTION}
            onAccessibilityAction={handlePress}
          >
            {resource.name}
          </Text>
          <View style={styles.subtitleRow}>
            <View style={[styles.chip, { backgroundColor: `${chip.color}22` }]}>
              <Text style={[styles.chipText, { color: chip.color }]}>
                {chip.label}
              </Text>
            </View>
            {resource.subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {resource.subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        {deploymentUuid ? (
          <Pressable
            onPress={handleOpenDeployment}
            hitSlop={spacing.lg}
            accessibilityRole="button"
            accessibilityLabel="Deploying"
            accessibilityHint="Opens the live deployment logs"
          >
            <StatusBadge status={status} />
          </Pressable>
        ) : (
          <StatusBadge status={status} />
        )}
      </View>

      {/* Keyed so a recycled cell doesn't carry an in-flight spinner over to
          another resource. */}
      <ResourceActions
        key={resource.uuid}
        resource={resource}
        supportsResourceLogs={supportsResourceLogs}
        onDeploy={onDeploy}
        onPullLatest={onPullLatest}
        onRestart={onRestart}
        onStart={onStart}
        onStop={onStop}
        onViewLogs={onViewLogs}
        onOpenDeployment={onOpenDeployment}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
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
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: 4,
  },
  chip: {
    paddingVertical: 1,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  chipText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  subtitle: {
    flex: 1,
    fontSize: 11,
    color: colors.text.disabled,
  },
});
