import { DetailRow } from "@/components/detail-row";
import { DetailTable } from "@/components/detail-table";
import { ModalHeader } from "@/components/modal-header";
import { IconButton } from "@/components/ui/icon-button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { StatusBadge } from "@/components/ui/status-badge";
import { Text } from "@/components/ui/text";
import { LIVE_DEPLOYMENT_REFRESH_INTERVAL, LOG_LINES } from "@/constants";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { useScrollFollow } from "@/hooks/useScrollFollow";
import { triggerHaptic } from "@/lib/haptics";
import { useCoolifyApi } from "@/providers/coolify-api-provider";
import { colors, radius, spacing } from "@/theme";
import type { DeploymentResponse } from "@/types/api";
import { formatDateTime } from "@/utils/date";
import {
  canCancelDeployment,
  getDeploymentStatus,
  isDeploymentActive,
} from "@/utils/status";
import { lastLines } from "@/utils/string";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
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

  const { api, isConfigured, isInitializing } = useCoolifyApi();

  const [deployment, setDeployment] = useState<DeploymentResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Set once the deployment was seen running, so the lines that arrive with
  // the final status are still scrolled into view.
  const [wasLive, setWasLive] = useState(false);

  /** Silent by default: used by live polling without flashing a spinner. */
  const fetchDeployment = useCallback(
    async (showRefreshing = false) => {
      // Wait for the provider; once it's ready, no API means no instance.
      if (isInitializing || !uuid) return;
      if (!isConfigured || !api) {
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
    [uuid, api, isConfigured, isInitializing],
  );

  useEffect(() => {
    fetchDeployment();
  }, [fetchDeployment]);

  const isActive = isDeploymentActive(deployment?.status);

  useEffect(() => {
    if (isActive) setWasLive(true);
  }, [isActive]);

  const { scrollViewRef, onScroll, onContentSizeChange } = useScrollFollow(
    isActive || wasLive,
  );

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

  const buildLogs = useMemo(
    () => parseDeploymentLogs(deployment?.logs),
    [deployment?.logs],
  );

  // While live, re-render only the tail: a full build log re-laid out every
  // few seconds stutters on low-end phones. The full log shows once it ends.
  const visibleLogs = useMemo(
    () => (isActive ? lastLines(buildLogs, LOG_LINES) : buildLogs),
    [isActive, buildLogs],
  );
  const isLogTruncated = visibleLogs.length < buildLogs.length;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ModalHeader title="Deployment" onClose={handleClose} />
        <LoadingSpinner message="Loading deployment..." />
      </View>
    );
  }

  // A failed live poll keeps showing the last known state.
  if (!deployment) {
    return (
      <View style={styles.container}>
        <ModalHeader title="Error" onClose={handleClose} />
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
      <ModalHeader
        title={deployment.application_name || "Deployment Details"}
        onClose={handleClose}
      >
        {canCancelDeployment(deployment.status) && (
          <IconButton
            name="cancel"
            size={24}
            color={colors.status.error}
            onPress={handleCancel}
            loading={isCancelling}
            accessibilityLabel="Cancel deployment"
          />
        )}
        <IconButton
          name="refresh"
          size={24}
          onPress={handleRefresh}
          loading={isRefreshing}
          accessibilityLabel="Refresh deployment"
        />
      </ModalHeader>

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        onScroll={onScroll}
        scrollEventThrottle={100}
        onContentSizeChange={onContentSizeChange}
      >
        {/* A failed poll keeps the last state on screen: say it's stale. */}
        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

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
            <Text style={styles.logsTitle}>
              {isLogTruncated
                ? `Build Logs · last ${LOG_LINES} lines while live`
                : "Build Logs"}
            </Text>
            <View style={styles.logsBox}>
              <Text style={styles.logsText} selectable>
                {visibleLogs}
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
    backgroundColor: colors.background.code,
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
  errorBanner: {
    fontSize: 12,
    color: colors.status.error,
    backgroundColor: colors.status.errorBg,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    fontSize: 14,
    color: colors.status.error,
    textAlign: "center",
  },
});
