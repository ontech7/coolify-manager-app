import { ModalHeader } from "@/components/modal-header";
import { AutoRefreshButton } from "@/components/ui/auto-refresh-button";
import { Chip } from "@/components/ui/chip";
import { IconButton } from "@/components/ui/icon-button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Text } from "@/components/ui/text";
import { LOG_LINES } from "@/constants";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { useScrollFollow } from "@/hooks/useScrollFollow";
import { useCoolifyApi } from "@/providers/coolify-api-provider";
import { colors, radius, spacing } from "@/theme";
import type { ResourceType, ServiceContainer } from "@/types/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Container logs for an application, a database or one container of a
 * service (`?type=`). Database and service logs need Coolify >= 4.2.0.
 */
export default function LogsViewerModal() {
  const {
    uuid,
    type = "application",
    name,
  } = useLocalSearchParams<{
    uuid: string;
    type?: ResourceType;
    name?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { api, isConfigured, isInitializing } = useCoolifyApi();

  const [logs, setLogs] = useState("");
  const [containers, setContainers] = useState<ServiceContainer[]>([]);
  const [container, setContainer] = useState<ServiceContainer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveTail, setLiveTail] = useState(false);

  const { scrollViewRef, onScroll, onContentSizeChange, scrollToEnd } =
    useScrollFollow(true);
  // Only the latest request may update the screen: switching container while
  // a request is in flight must not show the previous container's logs.
  const requestIdRef = useRef(0);

  // A service is a group of containers: load them first, logs are per container.
  const loadContainers = useCallback(async () => {
    if (type !== "service" || !api || !uuid) return;

    try {
      const service = await api.getService(uuid);
      const list = [
        ...(service.applications ?? []),
        ...(service.databases ?? []),
      ];
      setContainers(list);
      setContainer(list[0] ?? null);
      if (list.length === 0) {
        setError("This service has no containers.");
        setIsLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load service");
      setIsLoading(false);
    }
  }, [type, api, uuid]);

  useEffect(() => {
    loadContainers();
  }, [loadContainers]);

  const fetchLogs = useCallback(
    async (showRefreshing = false) => {
      // Wait for the provider; once it's ready, no API means no instance.
      if (isInitializing || !uuid) return;
      if (!isConfigured || !api) {
        setError("Not configured");
        setIsLoading(false);
        return;
      }
      if (type === "service" && !container) return;

      const requestId = ++requestIdRef.current;
      if (showRefreshing) setIsRefreshing(true);

      try {
        const result =
          type === "database"
            ? await api.getDatabaseLogs(uuid, LOG_LINES)
            : type === "service" && container
              ? await api.getServiceLogs(uuid, container.name, LOG_LINES)
              : await api.getApplicationLogs(uuid, LOG_LINES);

        if (requestId !== requestIdRef.current) return;
        setLogs(result.logs || "No logs available");
        setError(null);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setError(err instanceof Error ? err.message : "Failed to load logs");
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [uuid, api, isConfigured, isInitializing, type, container],
  );

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Keeps polling after a failed tick, so live tail recovers on its own.
  useAutoRefresh(fetchLogs, liveTail);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleRefresh = useCallback(() => {
    if (type === "service" && !container) {
      setError(null);
      setIsLoading(true);
      loadContainers();
    } else {
      fetchLogs(true);
    }
  }, [type, container, loadContainers, fetchLogs]);

  const handleToggleLiveTail = useCallback(() => {
    setLiveTail((prev) => !prev);
  }, []);

  const handleSelectContainer = useCallback(
    (item: ServiceContainer) => {
      if (item.uuid === container?.uuid) return;
      setContainer(item);
      setLogs("");
      setError(null);
      setIsLoading(true);
    },
    [container],
  );

  return (
    <View style={styles.container}>
      <ModalHeader
        title={name ? `${name} · Logs` : "Logs"}
        onClose={handleClose}
      >
        <AutoRefreshButton
          enabled={liveTail}
          onToggle={handleToggleLiveTail}
          label="Live"
        />
        <IconButton
          name="refresh"
          size={24}
          onPress={handleRefresh}
          loading={isRefreshing}
          accessibilityLabel="Refresh logs"
        />
      </ModalHeader>

      {containers.length > 1 && (
        <ScrollView
          horizontal
          style={styles.containersBar}
          contentContainerStyle={styles.containers}
          showsHorizontalScrollIndicator={false}
        >
          {containers.map((item) => (
            <Chip
              key={item.uuid}
              label={item.human_name || item.name}
              active={item.uuid === container?.uuid}
              onPress={() => handleSelectContainer(item)}
            />
          ))}
        </ScrollView>
      )}

      {isLoading ? (
        <LoadingSpinner message="Loading logs..." />
      ) : error && !logs ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.logsContainer}
          contentContainerStyle={[
            styles.logsContent,
            { paddingBottom: insets.bottom + spacing["4xl"] },
          ]}
          onScroll={onScroll}
          scrollEventThrottle={100}
          onContentSizeChange={onContentSizeChange}
        >
          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
          <Text style={styles.logsText} selectable>
            {logs}
          </Text>
        </ScrollView>
      )}

      <View
        style={[styles.footer, { marginBottom: insets.bottom + spacing.lg }]}
      >
        <IconButton
          name="expand-more"
          size={24}
          onPress={scrollToEnd}
          accessibilityLabel="Scroll to latest"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  containersBar: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
  },
  containers: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  logsContainer: {
    flex: 1,
    backgroundColor: colors.background.code,
  },
  logsContent: {
    padding: spacing.lg,
  },
  logsText: {
    fontFamily: "monospace",
    fontSize: 11,
    lineHeight: 18,
    color: colors.text.secondary,
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
  errorBanner: {
    fontSize: 12,
    color: colors.status.error,
    backgroundColor: colors.status.errorBg,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    right: spacing.xl,
    backgroundColor: colors.surface.default,
    borderRadius: radius.full,
    padding: spacing.sm,
  },
});
