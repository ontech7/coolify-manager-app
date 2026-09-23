import { DetailRow } from "@/components/detail-row";
import { DetailTable } from "@/components/detail-table";
import { ModalHeader } from "@/components/modal-header";
import { HealthPill } from "@/components/servers/health-pill";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { StatusBadge } from "@/components/ui/status-badge";
import { Text } from "@/components/ui/text";
import { SERVER_ACTIONS_MIN_VERSION } from "@/constants";
import { triggerHaptic } from "@/lib/haptics";
import { useCoolifyApi } from "@/providers/coolify-api-provider";
import { colors, radius, spacing } from "@/theme";
import type { ServerResource, ServerResponse } from "@/types/api";
import { getResourceStatus } from "@/utils/status";
import { MaterialIcons } from "@react-native-vector-icons/material-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function cleanResourceType(type: string): string {
  const last = type.split("\\").pop() ?? type;
  return last.replace(/^Standalone/, "");
}

type ServerAction = "proxy" | "cleanup";

export default function ServerDetailsModal() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { api, isConfigured, activeInstance } = useCoolifyApi();

  const [server, setServer] = useState<ServerResponse | null>(null);
  const [resources, setResources] = useState<ServerResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [runningAction, setRunningAction] = useState<ServerAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchServer = useCallback(async () => {
    if (!uuid || !api) return;

    setIsLoading(true);
    setError(null);

    try {
      if (!isConfigured) {
        setError("Not configured");
        return;
      }

      const [srv, res] = await Promise.allSettled([
        api.getServer(uuid),
        api.getServerResources(uuid),
      ]);

      if (srv.status === "fulfilled") setServer(srv.value);
      else throw srv.reason;

      setResources(res.status === "fulfilled" ? res.value : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load server");
    } finally {
      setIsLoading(false);
    }
  }, [uuid, api, isConfigured]);

  useEffect(() => {
    if (api) {
      fetchServer();
    }
  }, [api, fetchServer]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleValidate = useCallback(async () => {
    if (!uuid || !api) return;
    setIsValidating(true);
    try {
      await api.validateServer(uuid);
      triggerHaptic("success");
      await fetchServer();
    } catch (err) {
      triggerHaptic("error");
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to validate server",
      );
    } finally {
      setIsValidating(false);
    }
  }, [uuid, api, fetchServer]);

  const runAction = useCallback(
    async (action: ServerAction) => {
      if (!uuid || !api) return;
      setRunningAction(action);
      try {
        const result =
          action === "proxy"
            ? await api.restartProxy(uuid)
            : await api.runDockerCleanup(uuid);
        triggerHaptic("success");
        Alert.alert("Done", result.message);
      } catch (err) {
        triggerHaptic("error");
        Alert.alert(
          "Error",
          err instanceof Error ? err.message : "Action failed",
        );
      } finally {
        setRunningAction(null);
      }
    },
    [uuid, api],
  );

  const handleRestartProxy = useCallback(() => {
    triggerHaptic("warning");
    Alert.alert(
      "Restart Proxy",
      // The app can't tell 4.2.x from 4.3.0 (only legacy vs current), so say it
      // up front instead of failing after the user confirmed.
      `Every site on this server will be briefly unreachable while the proxy restarts.\n\nRequires Coolify ${SERVER_ACTIONS_MIN_VERSION} or newer.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restart",
          style: "destructive",
          onPress: () => runAction("proxy"),
        },
      ],
    );
  }, [runAction]);

  const handleDockerCleanup = useCallback(() => {
    triggerHaptic("warning");
    Alert.alert(
      "Docker Cleanup",
      `Remove unused images, build cache and stopped containers to free disk space?\n\nRequires Coolify ${SERVER_ACTIONS_MIN_VERSION} or newer.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clean Up",
          style: "destructive",
          onPress: () => runAction("cleanup"),
        },
      ],
    );
  }, [runAction]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ModalHeader title="Server" onClose={handleClose} />
        <LoadingSpinner message="Loading server..." />
      </View>
    );
  }

  if (error || !server) {
    return (
      <View style={styles.container}>
        <ModalHeader title="Error" onClose={handleClose} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || "Server not found"}</Text>
        </View>
      </View>
    );
  }

  const reachable = server.settings?.is_reachable ?? false;
  const usable = server.settings?.is_usable ?? false;

  return (
    <View style={styles.container}>
      <ModalHeader title={server.name} onClose={handleClose}>
        <IconButton
          name="wifi-tethering"
          size={24}
          onPress={handleValidate}
          loading={isValidating}
          accessibilityLabel="Validate server"
        />
      </ModalHeader>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <View style={styles.pills}>
          <HealthPill
            ok={reachable}
            label={reachable ? "Reachable" : "Unreachable"}
          />
          <HealthPill ok={usable} label={usable ? "Usable" : "Not usable"} />
        </View>

        {activeInstance?.apiMode !== "legacy" && (
          <View style={styles.actionsRow}>
            <Button
              title="Restart Proxy"
              variant="secondary"
              adornmentStart={
                <MaterialIcons
                  name="restart-alt"
                  size={18}
                  color={colors.action.restart}
                />
              }
              onPress={handleRestartProxy}
              loading={runningAction === "proxy"}
              disabled={runningAction !== null}
              style={styles.actionButton}
            />
            <Button
              title="Docker Cleanup"
              variant="secondary"
              adornmentStart={
                <MaterialIcons
                  name="cleaning-services"
                  size={18}
                  color={colors.action.deploy}
                />
              }
              onPress={handleDockerCleanup}
              loading={runningAction === "cleanup"}
              disabled={runningAction !== null}
              style={styles.actionButton}
            />
          </View>
        )}

        <DetailTable>
          <DetailRow label="UUID" value={server.uuid} mono copyable />
          <DetailRow label="Description" value={server.description} />
          <DetailRow label="IP" value={server.ip} mono copyable />
          <DetailRow
            label="Port"
            value={server.port ? String(server.port) : undefined}
          />
          <DetailRow label="User" value={server.user} />
        </DetailTable>

        <Text style={styles.sectionTitle}>
          Running Resources{resources.length ? ` (${resources.length})` : ""}
        </Text>
        {resources.length > 0 ? (
          <View style={styles.resourceCard}>
            {resources.map((res, index) => (
              <View
                key={res.uuid}
                style={[
                  styles.resourceRow,
                  index === resources.length - 1 && styles.resourceRowLast,
                ]}
              >
                <View style={styles.resourceInfo}>
                  <Text style={styles.resourceName} numberOfLines={1}>
                    {res.name}
                  </Text>
                  <Text style={styles.resourceType} numberOfLines={1}>
                    {cleanResourceType(res.type)}
                  </Text>
                </View>
                <StatusBadge status={getResourceStatus(res.status)} />
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyResources}>
            No resources running on this server.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
  },
  pills: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  actionButton: {
    flex: 1,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.secondary,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  resourceCard: {
    backgroundColor: colors.surface.default,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  resourceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
    gap: spacing.md,
  },
  resourceRowLast: {
    borderBottomWidth: 0,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceName: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text.primary,
  },
  resourceType: {
    fontSize: 11,
    color: colors.text.disabled,
    marginTop: 2,
  },
  emptyResources: {
    fontSize: 13,
    color: colors.text.muted,
    paddingVertical: spacing.lg,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  errorText: {
    fontSize: 14,
    color: colors.status.error,
    textAlign: "center",
  },
});
