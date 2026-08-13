import { IconButton } from "@/components/ui/icon-button";
import { triggerHaptic } from "@/hooks/useHaptics";
import { spacing } from "@/theme";
import type { Resource, ResourceType } from "@/types/api";
import { isResourceRunning } from "@/utils/status";
import { useCallback, useState } from "react";
import { Alert, Linking, StyleSheet, View } from "react-native";

interface ResourceActionsProps {
  resource: Resource;
  onDeploy: (uuid: string) => Promise<void>;
  onPullLatest: (uuid: string) => Promise<void>;
  onRestart: (uuid: string, type: ResourceType) => Promise<void>;
  onStart: (uuid: string, type: ResourceType) => Promise<void>;
  onStop: (uuid: string, type: ResourceType) => Promise<void>;
  onViewLogs: (uuid: string) => void;
}

type ActionType = "deploy" | "pull" | "restart" | "start" | "stop";

export function ResourceActions({
  resource,
  onDeploy,
  onPullLatest,
  onRestart,
  onStart,
  onStop,
  onViewLogs,
}: ResourceActionsProps) {
  const [loadingAction, setLoadingAction] = useState<ActionType | null>(null);

  const isApplication = resource.resourceType === "application";
  const isService = resource.resourceType === "service";
  const isRunning = isResourceRunning(resource.status);

  const handleAction = useCallback(
    async (
      action: ActionType,
      handler: (uuid: string, type: ResourceType) => Promise<void>,
    ) => {
      setLoadingAction(action);
      try {
        await handler(resource.uuid, resource.resourceType);
        triggerHaptic("success");
      } catch (error) {
        triggerHaptic("error");
        Alert.alert(
          "Error",
          error instanceof Error
            ? error.message
            : `Failed to ${action} ${resource.resourceType}`,
        );
      } finally {
        setLoadingAction(null);
      }
    },
    [resource.uuid, resource.resourceType],
  );

  const handleDeploy = useCallback(() => {
    triggerHaptic("warning");
    Alert.alert(
      "Deploy Application",
      `Are you sure you want to deploy "${resource.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deploy",
          onPress: () => handleAction("deploy", () => onDeploy(resource.uuid)),
        },
      ],
    );
  }, [resource.name, resource.uuid, handleAction, onDeploy]);

  const handlePullLatest = useCallback(() => {
    triggerHaptic("warning");
    Alert.alert(
      "Pull Latest Images",
      `Pull the latest images and redeploy "${resource.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Pull",
          onPress: () =>
            handleAction("pull", () => onPullLatest(resource.uuid)),
        },
      ],
    );
  }, [resource.name, resource.uuid, handleAction, onPullLatest]);

  const handleRestart = useCallback(() => {
    triggerHaptic("warning");
    Alert.alert(
      "Restart",
      `Are you sure you want to restart "${resource.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Restart", onPress: () => handleAction("restart", onRestart) },
      ],
    );
  }, [resource.name, handleAction, onRestart]);

  const handleStartStop = useCallback(() => {
    if (isRunning) {
      triggerHaptic("warning");
      Alert.alert("Stop", `Are you sure you want to stop "${resource.name}"?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Stop",
          style: "destructive",
          onPress: () => handleAction("stop", onStop),
        },
      ]);
    } else {
      handleAction("start", onStart);
    }
  }, [isRunning, resource.name, handleAction, onStart, onStop]);

  const handleViewLogs = useCallback(() => {
    onViewLogs(resource.uuid);
  }, [resource.uuid, onViewLogs]);

  const handleOpenWebsite = useCallback(() => {
    if (resource.fqdn) {
      const firstUrl = resource.fqdn.split(",")[0].trim();
      const url = firstUrl.startsWith("http")
        ? firstUrl
        : `https://${firstUrl}`;
      Linking.openURL(url);
    }
  }, [resource.fqdn]);

  return (
    <View style={styles.container}>
      <View style={styles.actionsLeft}>
        {isApplication && (
          <IconButton
            name="rocket"
            size={14}
            variant="deploy"
            onPress={handleDeploy}
            loading={loadingAction === "deploy"}
            disabled={loadingAction !== null}
          />
        )}
        {isService && (
          <IconButton
            name="cloud-download"
            size={14}
            variant="deploy"
            onPress={handlePullLatest}
            loading={loadingAction === "pull"}
            disabled={loadingAction !== null}
          />
        )}
        <IconButton
          name="restart-alt"
          size={14}
          variant="restart"
          onPress={handleRestart}
          loading={loadingAction === "restart"}
          disabled={loadingAction !== null || !isRunning}
        />
        <IconButton
          name={isRunning ? "stop" : "play-arrow"}
          size={14}
          variant={isRunning ? "stop" : "start"}
          onPress={handleStartStop}
          loading={loadingAction === "start" || loadingAction === "stop"}
          disabled={loadingAction !== null}
        />
      </View>
      <View style={styles.actionsRight}>
        {isApplication && (
          <IconButton
            name="article"
            size={14}
            variant="default"
            onPress={handleViewLogs}
            disabled={loadingAction !== null}
          />
        )}
        {isApplication && resource.fqdn && (
          <IconButton
            name="open-in-new"
            size={14}
            variant="default"
            onPress={handleOpenWebsite}
            disabled={loadingAction !== null}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  actionsLeft: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionsRight: {
    flexDirection: "row",
    gap: spacing.sm,
  },
});
