import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Text } from "@/components/ui/text";
import { colors, radius, spacing } from "@/theme";
import type { Resource, ResourceType } from "@/types/api";
import { getResourceStatus } from "@/utils/status";
import { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ResourceActions } from "./resource-actions";

interface ResourceCardProps {
  resource: Resource;
  onPress: (uuid: string) => void;
  onDeploy: (uuid: string) => Promise<void>;
  onRestart: (uuid: string, type: ResourceType) => Promise<void>;
  onStart: (uuid: string, type: ResourceType) => Promise<void>;
  onStop: (uuid: string, type: ResourceType) => Promise<void>;
  onViewLogs: (uuid: string) => void;
}

const typeChip: Record<ResourceType, { label: string; color: string }> = {
  application: { label: "APP", color: colors.action.deploy },
  database: { label: "DB", color: colors.status.warning },
  service: { label: "SVC", color: colors.status.success },
};

export function ResourceCard({
  resource,
  onPress,
  onDeploy,
  onRestart,
  onStart,
  onStop,
  onViewLogs,
}: ResourceCardProps) {
  const status = getResourceStatus(resource.status);
  const chip = typeChip[resource.resourceType];
  const isApplication = resource.resourceType === "application";

  const handlePress = useCallback(() => {
    onPress(resource.uuid);
  }, [onPress, resource.uuid]);

  return (
    <Card style={{ marginBottom: spacing.lg }}>
      <View style={styles.header}>
        <View style={styles.info}>
          <Pressable onPress={isApplication ? handlePress : undefined}>
            <Text style={styles.name} numberOfLines={1}>
              {resource.name}
            </Text>
          </Pressable>
          <View style={styles.subtitleRow}>
            <View
              style={[styles.chip, { backgroundColor: `${chip.color}22` }]}
            >
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
        <StatusBadge status={status} />
      </View>

      <ResourceActions
        resource={resource}
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
