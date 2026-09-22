import { IconButton } from "@/components/ui/icon-button";
import { triggerHaptic } from "@/hooks/useHaptics";
import { useCoolifyApi } from "@/providers/coolify-api-provider";
import { spacing } from "@/theme";
import type { Resource, ResourceType } from "@/types/api";
import { isResourceRunning } from "@/utils/status";
import { useCallback, useState } from "react";
import { Alert, Linking, StyleSheet, View } from "react-native";

interface ResourceActionsProps {
  resource: Resource;
  /** Resolves with the queued deployment's UUID, when Coolify returns one. */
  onDeploy: (uuid: string, force?: boolean) => Promise<string | undefined>;
  onPullLatest: (uuid: string) => Promise<void>;
  onRestart: (uuid: string, type: ResourceType) => Promise<void>;
  onStart: (uuid: string, type: ResourceType) => Promise<void>;
  onStop: (uuid: string, type: ResourceType) => Promise<void>;
  onViewLogs: (resource: Resource) => void;
  onOpenDeployment: (deploymentUuid: string) => void;
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
  onOpenDeployment,
}: ResourceActionsProps) {
  const { activeInstance } = useCoolifyApi();
  const [loadingAction, setLoadingAction] = useState<ActionType | null>(null);

  const isApplication = resource.resourceType === "application";
  const isService = resource.resourceType === "service";
  const isRunning = isResourceRunning(resource.status);
  // Database and service logs were added to the API in Coolify 4.2.0.
  const canViewLogs = isApplication || activeInstance?.apiMode !== "legacy";

  const handleAction = useCallback(
    async <T,>(
      action: ActionType,
      handler: (uuid: string, type: ResourceType) => Promise<T>,
    ): Promise<T | undefined> => {
      setLoadingAction(action);
      try {
        const result = await handler(resource.uuid, resource.resourceType);
        triggerHaptic("success");
        return result;
      } catch (error) {
        triggerHaptic("error");
        Alert.alert(
          "Error",
          error instanceof Error
            ? error.message
            : `Failed to ${action} ${resource.resourceType}`,
        );
        return undefined;
      } finally {
        setLoadingAction(null);
      }
    },
    [resource.uuid, resource.resourceType],
  );

  const runDeploy = useCallback(
    async (force: boolean) => {
      const deploymentUuid = await handleAction("deploy", (uuid) =>
        onDeploy(uuid, force),
      );
      if (!deploymentUuid) return;

      Alert.alert("Deployment queued", `"${resource.name}" is deploying.`, [
        { text: "OK", style: "cancel" },
        {
          text: "Watch live",
          onPress: () => onOpenDeployment(deploymentUuid),
        },
      ]);
    },
    [handleAction, onDeploy, onOpenDeployment, resource.name],
  );

  const handleDeploy = useCallback(() => {
    triggerHaptic("warning");
    Alert.alert(
      "Deploy Application",
      `Deploy "${resource.name}"? Force rebuild skips the build cache.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Force Rebuild", onPress: () => runDeploy(true) },
        { text: "Deploy", onPress: () => runDeploy(false) },
      ],
    );
  }, [resource.name, runDeploy]);

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
    onViewLogs(resource);
  }, [resource, onViewLogs]);

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
        {canViewLogs && (
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
