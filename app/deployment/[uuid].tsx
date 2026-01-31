import { DetailRow } from "@/components/detail-row";
import { IconButton } from "@/components/ui/icon-button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { StatusBadge } from "@/components/ui/status-badge";
import { Text } from "@/components/ui/text";
import { useCoolifyApi } from "@/providers/coolify-api-provider";
import { colors, radius, spacing } from "@/theme";
import type { DeploymentResponse, DeploymentStatus } from "@/types/api";
import { formatDateTime } from "@/utils/date";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
          <StatusBadge status={deployment.status as DeploymentStatus} />
        </View>

        <View style={styles.table}>
          <DetailRow label="UUID" value={deployment.deployment_uuid} mono />
          <DetailRow label="Application" value={deployment.application_name} />
          <DetailRow label="Server" value={deployment.server_name} />
          <DetailRow label="Commit" value={deployment.commit || "n/a"} mono />
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
        </View>
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
  table: {
    backgroundColor: colors.surface.default,
    borderRadius: radius.lg,
    overflow: "hidden",
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
