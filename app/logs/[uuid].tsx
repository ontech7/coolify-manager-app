import { AutoRefreshButton } from "@/components/ui/auto-refresh-button";
import { IconButton } from "@/components/ui/icon-button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Text } from "@/components/ui/text";
import { LOG_LINES } from "@/constants";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { useCoolifyApi } from "@/providers/coolify-api-provider";
import { colors, radius, spacing } from "@/theme";
import type { ResourceType, ServiceContainer } from "@/types/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
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
  const { api, isConfigured } = useCoolifyApi();

  const [logs, setLogs] = useState("");
  const [containers, setContainers] = useState<ServiceContainer[]>([]);
  const [container, setContainer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveTail, setLiveTail] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  // A service is a group of containers: load them first, logs are per container.
  useEffect(() => {
    if (type !== "service" || !api || !uuid) return;

    api
      .getService(uuid)
      .then((service) => {
        const list = [
          ...(service.applications ?? []),
          ...(service.databases ?? []),
        ];
        setContainers(list);
        setContainer(list[0]?.name ?? null);
        if (list.length === 0) {
          setError("This service has no containers.");
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load service");
        setIsLoading(false);
      });
  }, [type, api, uuid]);

  const fetchLogs = useCallback(
    async (showRefreshing = false) => {
      if (!uuid || !api) return;
      if (!isConfigured) {
        setError("Not configured");
        setIsLoading(false);
        return;
      }
      if (type === "service" && !container) return;

      if (showRefreshing) setIsRefreshing(true);

      try {
        const result =
          type === "database"
            ? await api.getDatabaseLogs(uuid, LOG_LINES)
            : type === "service" && container
              ? await api.getServiceLogs(uuid, container, LOG_LINES)
              : await api.getApplicationLogs(uuid, LOG_LINES);

        setLogs(result.logs || "No logs available");
        setError(null);

        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: false });
        }, 100);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load logs");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [uuid, api, isConfigured, type, container],
  );

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useAutoRefresh(fetchLogs, liveTail && !error);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleRefresh = useCallback(() => {
    fetchLogs(true);
  }, [fetchLogs]);

  const handleToggleLiveTail = useCallback(() => {
    setLiveTail((prev) => !prev);
  }, []);

  const handleSelectContainer = useCallback((containerName: string) => {
    setContainer(containerName);
    setLogs("");
    setIsLoading(true);
  }, []);

  const handleScrollToBottom = useCallback(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {name ? `${name} · Logs` : "Logs"}
        </Text>
        <View style={styles.headerActions}>
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
          />
          <IconButton name="close" size={24} onPress={handleClose} />
        </View>
      </View>

      {containers.length > 1 && (
        <ScrollView
          horizontal
          style={styles.containersBar}
          contentContainerStyle={styles.containers}
          showsHorizontalScrollIndicator={false}
        >
          {containers.map((item) => {
            const active = item.name === container;
            return (
              <Pressable
                key={item.uuid}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => handleSelectContainer(item.name)}
              >
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                >
                  {item.human_name || item.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {isLoading ? (
        <LoadingSpinner message="Loading logs..." />
      ) : error ? (
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
        >
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
          onPress={handleScrollToBottom}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    marginRight: spacing.lg,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
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
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.surface.default,
  },
  chipActive: {
    backgroundColor: colors.primary.background,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.text.muted,
  },
  chipTextActive: {
    color: colors.primary.light,
  },
  logsContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
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
  footer: {
    position: "absolute",
    bottom: 0,
    right: spacing.xl,
    backgroundColor: colors.surface.default,
    borderRadius: radius.full,
    padding: spacing.sm,
  },
});
