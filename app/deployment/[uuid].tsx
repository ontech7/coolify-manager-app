import { DetailRow } from "@/components/detail-row";
import { DetailTable } from "@/components/detail-table";
import { IconButton } from "@/components/ui/icon-button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { StatusBadge } from "@/components/ui/status-badge";
import { Text } from "@/components/ui/text";
import { useCoolifyApi } from "@/providers/coolify-api-provider";
import { colors, radius, spacing } from "@/theme";
import type { DeploymentResponse } from "@/types/api";
import { formatDateTime } from "@/utils/date";
import { getDeploymentStatus } from "@/utils/status";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
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
  const [error, setError] = useState<string | null>(null);

  const fetchDeployment = useCallback(async () => {
    if (!uuid || !api) return;

    setIsLoading(true);
    setError(null);

    try {
      if (!isConfigured) {
        setError("Not configured");
        return;
      }

      const dep = await api.getDeployment(uuid);
      setDeployment(dep);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load deployment",
      );
    } finally {
      setIsLoading(false);
    }
  }, [uuid, api, isConfigured]);

  useEffect(() => {
    if (api) {
      fetchDeployment();
    }
  }, [api, fetchDeployment]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleRefresh = useCallback(() => {
    fetchDeployment();
  }, [fetchDeployment]);

  const buildLogs = parseDeploymentLogs(deployment?.logs);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LoadingSpinner message="Loading deployment..." />
      </View>
    );
  }

  if (error || !deployment) {
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
          Deployment Details
        </Text>
        <View style={styles.headerActions}>
          <IconButton name="refresh" size={24} onPress={handleRefresh} />
          <IconButton name="close" size={24} onPress={handleClose} />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <View style={styles.statusRow}>
          <StatusBadge status={getDeploymentStatus(deployment.status)} />
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
    marginBottom: spacing.xl,
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
