import { DetailRow } from "@/components/detail-row";
import { DetailTable } from "@/components/detail-table";
import { IconButton } from "@/components/ui/icon-button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { StatusBadge } from "@/components/ui/status-badge";
import { Text } from "@/components/ui/text";
import {
  LIVE_DEPLOYMENT_REFRESH_INTERVAL,
  SCROLL_FOLLOW_THRESHOLD,
} from "@/constants";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { triggerHaptic } from "@/hooks/useHaptics";
import { useCoolifyApi } from "@/providers/coolify-api-provider";
import { colors, radius, spacing } from "@/theme";
import type { DeploymentResponse } from "@/types/api";
import { formatDateTime } from "@/utils/date";
import {
  canCancelDeployment,
  getDeploymentStatus,
  isDeploymentActive,
} from "@/utils/status";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Coolify stores deployment logs as a JSON-encoded array of entries
 * ({ output, type, timestamp, hidden, ... }). Fall back to the raw string if
 * it isn't valid JSON.
 */
function parseDeploymentLogs(raw?: string | null): string {
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((entry) => entry && !entry.hidden && entry.output != null)
        .map((entry) => String(entry.output))
        .join("\n")
        .trim();
    }
  } catch {
    // Not JSON — show as-is.
  }
  return raw.trim();
}

export default function DeploymentDetails() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const router = useRouter();

  const insets = useSafeAreaInsets();

  const { api, isConfigured } = useCoolifyApi();

  const [deployment, setDeployment] = useState<DeploymentResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  // Follow new log lines only while the user is at the bottom of the page.
  const isFollowingRef = useRef(true);
  // Set once the deployment was seen running, so the lines that arrive with
  // the final status are still scrolled into view.
  const wasLiveRef = useRef(false);

  /** Silent by default: used by live polling without flashing a spinner. */
  const fetchDeployment = useCallback(
    async (showRefreshing = false) => {
      if (!uuid || !api) return;

      if (!isConfigured) {
        setError("Not configured");
        setIsLoading(false);
        return;
      }

      if (showRefreshing) setIsRefreshing(true);

      try {
        const dep = await api.getDeployment(uuid);
        setDeployment(dep);
        setError(null);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load deployment";
        setError(message);
        // Once loaded, the screen keeps the last state: tell the user why a
        // manual refresh didn't change anything.
        if (showRefreshing) Alert.alert("Error", message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [uuid, api, isConfigured],
  );

  useEffect(() => {
    if (api) {
      fetchDeployment();
    }
  }, [api, fetchDeployment]);

  const isActive = isDeploymentActive(deployment?.status);

  useEffect(() => {
    if (isActive) wasLiveRef.current = true;
  }, [isActive]);

  // Watch the build live while it's queued or running.
  useAutoRefresh(fetchDeployment, isActive, LIVE_DEPLOYMENT_REFRESH_INTERVAL);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleRefresh = useCallback(() => {
    fetchDeployment(true);
  }, [fetchDeployment]);

  const handleCancel = useCallback(() => {
    if (!uuid || !api) return;
    Alert.alert(
      "Cancel Deployment",
      "Are you sure you want to cancel this deployment?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            setIsCancelling(true);
            try {
              await api.cancelDeployment(uuid);
              triggerHaptic("success");
              await fetchDeployment();
            } catch (err) {
              triggerHaptic("error");
              Alert.alert(
                "Error",
                err instanceof Error
                  ? err.message
                  : "Failed to cancel deployment",
              );
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ],
    );
  }, [uuid, api, fetchDeployment]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } =
        event.nativeEvent;
      isFollowingRef.current =
        layoutMeasurement.height + contentOffset.y >=
        contentSize.height - SCROLL_FOLLOW_THRESHOLD;
    },
    [],
  );

  const handleContentSizeChange = useCallback(() => {
    if ((isActive || wasLiveRef.current) && isFollowingRef.current) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [isActive]);

  const buildLogs = useMemo(
    () => parseDeploymentLogs(deployment?.logs),
    [deployment?.logs],
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LoadingSpinner message="Loading deployment..." />
      </View>
    );
  }

  // A failed live poll keeps showing the last known state.
  if (!deployment) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Error</Text>
          <IconButton name="close" size={24} onPress={handleClose} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error || "Deployment not found"}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {deployment.application_name || "Deployment Details"}
        </Text>
        <View style={styles.headerActions}>
          {canCancelDeployment(deployment.status) && (
            <IconButton
              name="cancel"
              size={24}
              color={colors.status.error}
              onPress={handleCancel}
              loading={isCancelling}
            />
          )}
          <IconButton
            name="refresh"
            size={24}
            onPress={handleRefresh}
            loading={isRefreshing}
          />
          <IconButton name="close" size={24} onPress={handleClose} />
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={100}
        onContentSizeChange={handleContentSizeChange}
      >
        <View style={styles.statusRow}>
          <StatusBadge status={getDeploymentStatus(deployment.status)} />
          {isActive && (
            <Text style={styles.liveHint}>
              Live · updates every {LIVE_DEPLOYMENT_REFRESH_INTERVAL / 1000}s
            </Text>
          )}
        </View>

        <DetailTable>
          <DetailRow
            label="UUID"
            value={deployment.deployment_uuid}
            mono
            copyable
          />
          <DetailRow label="Application" value={deployment.application_name} />
          <DetailRow label="Server" value={deployment.server_name} />
          <DetailRow
            label="Commit"
            value={deployment.commit || "n/a"}
            mono
            copyable={!!deployment.commit}
          />
          <DetailRow
            label="Message"
            value={deployment.commit_message || "n/a"}
          />
          <DetailRow label="Git Type" value={deployment.git_type || "n/a"} />
          <DetailRow
            label="Webhook"
            value={deployment.is_webhook ? "Yes" : "No"}
          />
          <DetailRow
            label="API Triggered"
            value={deployment.is_api ? "Yes" : "No"}
          />
          <DetailRow
            label="Force Rebuild"
            value={deployment.force_rebuild ? "Yes" : "No"}
          />
          <DetailRow
            label="Restart Only"
            value={deployment.restart_only ? "Yes" : "No"}
          />
          <DetailRow
            label="Created"
            value={formatDateTime(deployment.created_at)}
          />
          <DetailRow
            label="Updated"
            value={formatDateTime(deployment.updated_at)}
          />
        </DetailTable>

        {buildLogs ? (
          <View style={styles.logsSection}>
            <Text style={styles.logsTitle}>Build Logs</Text>
            <View style={styles.logsBox}>
              <Text style={styles.logsText} selectable>
                {buildLogs}
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  liveHint: {
    fontSize: 12,
    color: colors.text.muted,
  },
  logsSection: {
    marginTop: spacing.xl,
  },
  logsTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  logsBox: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: radius.lg,
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
});
