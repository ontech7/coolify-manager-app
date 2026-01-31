import { triggerHaptic } from "@/hooks/useHaptics";
import { spacing } from "@/theme";
import type { ApplicationResponse } from "@/types/api";
import { isApplicationRunning } from "@/utils/status";
import { IconButton } from "@/components/ui/icon-button";
import { useCallback, useState } from "react";
import { Alert, Linking, StyleSheet, View } from "react-native";

interface ApplicationActionsProps {
  application: ApplicationResponse;
  onDeploy: (uuid: string) => Promise<void>;
  onRestart: (uuid: string) => Promise<void>;
  onStart: (uuid: string) => Promise<void>;
  onStop: (uuid: string) => Promise<void>;
  onViewLogs: (uuid: string) => void;
}

type ActionType = "deploy" | "restart" | "start" | "stop";

export function ApplicationActions({
  application,
  onDeploy,
  onRestart,
  onStart,
  onStop,
  onViewLogs,
}: ApplicationActionsProps) {
  const [loadingAction, setLoadingAction] = useState<ActionType | null>(null);

  const isRunning = isApplicationRunning(application);

  const handleAction = useCallback(
    async (action: ActionType, handler: (uuid: string) => Promise<void>) => {
      setLoadingAction(action);
      try {
        await handler(application.uuid);
        triggerHaptic("success");
      } catch (error) {
        triggerHaptic("error");
        Alert.alert(
          "Error",
          error instanceof Error
            ? error.message
            : `Failed to ${action} application`,
        );
      } finally {
        setLoadingAction(null);
      }
    },
    [application.uuid],
  );

  const handleDeploy = useCallback(() => {
    triggerHaptic("warning");
    Alert.alert(
      "Deploy Application",
      `Are you sure you want to deploy "${application.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Deploy", onPress: () => handleAction("deploy", onDeploy) },
      ],
    );
  }, [application.name, handleAction, onDeploy]);

  const handleRestart = useCallback(() => {
    triggerHaptic("warning");
    Alert.alert(
      "Restart Application",
      `Are you sure you want to restart "${application.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Restart", onPress: () => handleAction("restart", onRestart) },
      ],
    );
  }, [application.name, handleAction, onRestart]);

  const handleStartStop = useCallback(() => {
    if (isRunning) {
      triggerHaptic("warning");
      Alert.alert(
        "Stop Application",
        `Are you sure you want to stop "${application.name}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Stop",
            style: "destructive",
            onPress: () => handleAction("stop", onStop),
          },
        ],
      );
    } else {
      handleAction("start", onStart);
    }
  }, [isRunning, application.name, handleAction, onStart, onStop]);

  const handleViewLogs = useCallback(() => {
    onViewLogs(application.uuid);
  }, [application.uuid, onViewLogs]);

  const handleOpenWebsite = useCallback(() => {
    if (application.fqdn) {
      const firstUrl = application.fqdn.split(",")[0].trim();
      const url = firstUrl.startsWith("http")
        ? firstUrl
        : `https://${firstUrl}`;
      Linking.openURL(url);
    }
  }, [application.fqdn]);

  return (
    <View style={styles.container}>
      <View style={styles.actionsLeft}>
        <IconButton
          name="rocket"
          size={14}
          variant="deploy"
          onPress={handleDeploy}
          loading={loadingAction === "deploy"}
          disabled={loadingAction !== null}
        />
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
        <IconButton
          name="article"
          size={14}
          variant="default"
          onPress={handleViewLogs}
          disabled={loadingAction !== null}
        />
        {application.fqdn && (
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
