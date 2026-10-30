import { IconButton } from "@/components/ui/icon-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Text } from "@/components/ui/text";
import { triggerHaptic } from "@/lib/haptics";
import { colors, spacing } from "@/theme";
import type { ContainerAction, ServiceContainer } from "@/types/api";
import { getResourceStatus, isResourceRunning } from "@/utils/status";
import { useCallback, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, View } from "react-native";

interface ServiceContainerRowProps {
  container: ServiceContainer;
  isLast: boolean;
  /** Per-container actions and logs need Coolify >= 4.2.0. */
  showActions: boolean;
  onAction: (
    container: ServiceContainer,
    action: ContainerAction,
  ) => Promise<void>;
  onViewLogs: (container: ServiceContainer) => void;
}

/** One container of a service: status, image, URLs and its own actions. */
export function ServiceContainerRow({
  container,
  isLast,
  showActions,
  onAction,
  onViewLogs,
}: ServiceContainerRowProps) {
  const [loadingAction, setLoadingAction] = useState<ContainerAction | null>(
    null,
  );
  // Coolify only queues start/stop: keep showing "Starting"/"Stopping" until
  // the reported status moves on, so the button isn't pressed twice.
  const [pending, setPending] = useState<{
    kind: "starting" | "stopping";
    fromStatus?: string;
  } | null>(null);
  const name = container.human_name || container.name;
  const isRunning = isResourceRunning(container.status);
  const pendingKind =
    pending && pending.fromStatus === container.status ? pending.kind : null;
  const urls = (container.fqdn ?? "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  const runAction = useCallback(
    async (action: ContainerAction) => {
      setLoadingAction(action);
      try {
        if (action !== "restart") {
          setPending({
            kind: action === "start" ? "starting" : "stopping",
            fromStatus: container.status,
          });
        }
        await onAction(container, action);
        triggerHaptic("success");
      } catch (error) {
        setPending(null);
        triggerHaptic("error");
        Alert.alert(
          "Error",
          error instanceof Error ? error.message : `Failed to ${action} ${name}`,
        );
      } finally {
        setLoadingAction(null);
      }
    },
    [container, name, onAction],
  );

  const handleRestart = useCallback(() => {
    triggerHaptic("warning");
    Alert.alert("Restart", `Are you sure you want to restart "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Restart", onPress: () => runAction("restart") },
    ]);
  }, [name, runAction]);

  const handleStartStop = useCallback(() => {
    if (!isRunning) {
      runAction("start");
      return;
    }
    triggerHaptic("warning");
    Alert.alert("Stop", `Are you sure you want to stop "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Stop",
        style: "destructive",
        onPress: () => runAction("stop"),
      },
    ]);
  }, [isRunning, name, runAction]);

  const handleViewLogs = useCallback(() => {
    onViewLogs(container);
  }, [container, onViewLogs]);

  const handleOpenUrl = useCallback((url: string) => {
    Linking.openURL(url.startsWith("http") ? url : `https://${url}`);
  }, []);

  return (
    <View style={[styles.row, isLast && styles.rowLast]}>
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {container.image ? (
            <Text style={styles.image} numberOfLines={1}>
              {container.image}
            </Text>
          ) : null}
        </View>
        <StatusBadge
          status={pendingKind ?? getResourceStatus(container.status)}
        />
      </View>

      {urls.map((url) => (
        <Pressable key={url} onPress={() => handleOpenUrl(url)}>
          <Text style={styles.link} numberOfLines={1}>
            {url}
          </Text>
        </Pressable>
      ))}

      {showActions && (
        <View style={styles.actions}>
          <View style={styles.actionsLeft}>
            <IconButton
              name="restart-alt"
              accessibilityLabel={`Restart ${name}`}
              size={14}
              variant="restart"
              onPress={handleRestart}
              loading={loadingAction === "restart"}
              disabled={loadingAction !== null || !isRunning || !!pendingKind}
            />
            <IconButton
              name={isRunning ? "stop" : "play-arrow"}
              accessibilityLabel={`${isRunning ? "Stop" : "Start"} ${name}`}
              size={14}
              variant={isRunning ? "stop" : "start"}
              onPress={handleStartStop}
              loading={loadingAction === "start" || loadingAction === "stop"}
              disabled={loadingAction !== null || !!pendingKind}
            />
          </View>
          <IconButton
            name="article"
            accessibilityLabel={`View ${name} logs`}
            size={14}
            variant="default"
            onPress={handleViewLogs}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text.primary,
  },
  image: {
    fontFamily: "monospace",
    fontSize: 11,
    color: colors.text.disabled,
    marginTop: 2,
  },
  link: {
    fontSize: 13,
    color: colors.status.info,
    textDecorationLine: "underline",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionsLeft: {
    flexDirection: "row",
    gap: spacing.sm,
  },
});
