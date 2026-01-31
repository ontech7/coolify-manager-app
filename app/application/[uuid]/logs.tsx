import { IconButton } from "@/components/ui/icon-button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Text } from "@/components/ui/text";
import { useCoolifyApi } from "@/providers/coolify-api-provider";
import { colors, radius, spacing } from "@/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LogsViewerModal() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const router = useRouter();

  const insets = useSafeAreaInsets();

  const { api, isConfigured } = useCoolifyApi();

  const [logs, setLogs] = useState<string>("");
  const [appName, setAppName] = useState<string>("");

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);

  const fetchLogs = useCallback(
    async (showRefreshing = false) => {
      if (!uuid || !api) return;

      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        if (!isConfigured) {
          setError("Not configured");
          return;
        }

        if (!appName) {
          const app = await api.getApplication(uuid);
          setAppName(app.name);
        }

        const result = await api.getApplicationLogs(uuid, 500);
        setLogs(result.logs || "No logs available");

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
    [uuid, api, isConfigured, appName],
  );

  useEffect(() => {
    if (api) {
      fetchLogs();
    }
  }, [api, fetchLogs]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleRefresh = useCallback(() => {
    fetchLogs(true);
  }, [fetchLogs]);

  const handleScrollToBottom = useCallback(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LoadingSpinner message="Loading logs..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {appName ? `${appName} - Logs` : "Logs"}
        </Text>
        <View style={styles.headerActions}>
          <IconButton
            name="refresh"
            size={24}
            onPress={handleRefresh}
            loading={isRefreshing}
          />
          <IconButton name="close" size={24} onPress={handleClose} />
        </View>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.logsContainer}
          contentContainerStyle={[
            styles.logsContent,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          horizontal={false}
          showsVerticalScrollIndicator={true}
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
