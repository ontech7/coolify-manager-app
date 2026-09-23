import { DetailRow } from "@/components/detail-row";
import { DetailTable } from "@/components/detail-table";
import { ModalHeader } from "@/components/modal-header";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { StatusBadge } from "@/components/ui/status-badge";
import { Text } from "@/components/ui/text";
import { MaterialIcons } from "@react-native-vector-icons/material-icons";
import { useCoolifyApi } from "@/providers/coolify-api-provider";
import { colors, radius, spacing } from "@/theme";
import type { ApplicationResponse } from "@/types/api";
import { formatDateTime } from "@/utils/date";
import { getApplicationStatus } from "@/utils/status";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ApplicationDetailsModal() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const router = useRouter();

  const insets = useSafeAreaInsets();

  const { api, isConfigured, activeInstance } = useCoolifyApi();

  const [application, setApplication] = useState<ApplicationResponse | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplication = useCallback(async () => {
    if (!uuid || !api) return;

    setIsLoading(true);
    setError(null);

    try {
      if (!isConfigured) {
        setError("Not configured");
        return;
      }

      const app = await api.getApplication(uuid);
      setApplication(app);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load application",
      );
    } finally {
      setIsLoading(false);
    }
  }, [uuid, api, isConfigured]);

  useEffect(() => {
    if (api) {
      fetchApplication();
    }
  }, [api, fetchApplication]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const encodedName = encodeURIComponent(application?.name ?? "");

  const handleViewLogs = useCallback(() => {
    router.push(`/logs/${uuid}?type=application&name=${encodedName}` as Href);
  }, [router, uuid, encodedName]);

  const handleViewDeployments = useCallback(() => {
    router.push(`/application/${uuid}/deployments` as Href);
  }, [router, uuid]);

  const handleRollback = useCallback(() => {
    router.push(`/application/${uuid}/rollback?name=${encodedName}` as Href);
  }, [router, uuid, encodedName]);

  const fqdnUrls = useMemo(
    () =>
      (application?.fqdn ?? "")
        .split(",")
        .map((url) => url.trim())
        .filter(Boolean),
    [application?.fqdn],
  );

  const handleOpenUrl = useCallback((url: string) => {
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    Linking.openURL(normalized);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ModalHeader title="Application" onClose={handleClose} />
        <LoadingSpinner message="Loading application..." />
      </View>
    );
  }

  if (error || !application) {
    return (
      <View style={styles.container}>
        <ModalHeader title="Error" onClose={handleClose} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error || "Application not found"}
          </Text>
        </View>
      </View>
    );
  }

  const status = getApplicationStatus(application);

  return (
    <View style={styles.container}>
      <ModalHeader title={application.name} onClose={handleClose} />

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <View style={styles.statusRow}>
          <StatusBadge status={status} />
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            style={styles.actionButton}
            onPress={handleViewDeployments}
          >
            <MaterialIcons
              name="history"
              size={20}
              color={colors.primary.light}
            />
            <Text style={styles.actionButtonText} numberOfLines={1}>
              History
            </Text>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={handleViewLogs}>
            <MaterialIcons
              name="article"
              size={20}
              color={colors.primary.light}
            />
            <Text style={styles.actionButtonText} numberOfLines={1}>
              Logs
            </Text>
          </Pressable>
          {activeInstance?.apiMode !== "legacy" && (
            <Pressable style={styles.actionButton} onPress={handleRollback}>
              <MaterialIcons
                name="settings-backup-restore"
                size={20}
                color={colors.primary.light}
              />
              <Text style={styles.actionButtonText} numberOfLines={1}>
                Rollback
              </Text>
            </Pressable>
          )}
        </View>

        <DetailTable>
          <DetailRow label="UUID" value={application.uuid} mono copyable />
          <DetailRow label="Type" value={application.type} />
          <DetailRow label="Build Pack" value={application.build_pack} />
          <DetailRow label="URL">
            {fqdnUrls.length > 0 ? (
              <View style={styles.linkList}>
                {fqdnUrls.map((url) => (
                  <Pressable key={url} onPress={() => handleOpenUrl(url)}>
                    <Text style={styles.linkValue} numberOfLines={1}>
                      {url}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={styles.naValue}>n/a</Text>
            )}
          </DetailRow>
          <DetailRow
            label="Repository"
            value={application.git_repository || "n/a"}
            copyable={!!application.git_repository}
          />
          <DetailRow
            label="Branch"
            value={application.git_branch || "n/a"}
            mono
          />
          <DetailRow
            label="Created"
            value={formatDateTime(application.created_at)}
          />
          <DetailRow
            label="Updated"
            value={formatDateTime(application.updated_at)}
          />
        </DetailTable>
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
    marginBottom: spacing.xl,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface.default,
    borderWidth: 1,
    borderColor: colors.surface.border,
    borderRadius: radius.md,
  },
  actionButtonText: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "500",
    color: colors.text.primary,
  },
  linkList: {
    flex: 1,
    gap: spacing.sm,
  },
  linkValue: {
    fontSize: 13,
    color: colors.status.info,
    textDecorationLine: "underline",
  },
  naValue: {
    flex: 1,
    fontSize: 13,
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
