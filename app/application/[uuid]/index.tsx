import { DetailRow } from "@/components/detail-row";
import { IconButton } from "@/components/ui/icon-button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { StatusBadge } from "@/components/ui/status-badge";
import { Text } from "@/components/ui/text";
import { useCoolifyApi } from "@/providers/coolify-api-provider";
import { colors, radius, spacing } from "@/theme";
import type { ApplicationResponse } from "@/types/api";
import { formatDateTime } from "@/utils/date";
import { getApplicationStatus } from "@/utils/status";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ApplicationDetailsModal() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const router = useRouter();

  const insets = useSafeAreaInsets();

  const { api, isConfigured } = useCoolifyApi();

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

  const handleViewLogs = useCallback(() => {
    router.push(`/application/${uuid}/logs` as Href);
  }, [router, uuid]);

  const handleOpenWebsite = useCallback(() => {
    if (application?.fqdn) {
      Linking.openURL(application.fqdn);
    }
  }, [application?.fqdn]);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LoadingSpinner message="Loading application..." />
      </View>
    );
  }

  if (error || !application) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Error</Text>
          <IconButton name="close" size={24} onPress={handleClose} />
        </View>
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
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {application.name}
        </Text>
        <View style={styles.headerActions}>
          <IconButton name="article" size={24} onPress={handleViewLogs} />
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
          <StatusBadge status={status} />
        </View>

        <View style={styles.table}>
          <DetailRow label="UUID" value={application.uuid} mono />
          <DetailRow label="Type" value={application.type} />
          <DetailRow label="Build Pack" value={application.build_pack} />
          <DetailRow label="URL">
            <Pressable onPress={handleOpenWebsite}>
              <Text style={styles.linkValue}>{application.fqdn || "n/a"}</Text>
            </Pressable>
          </DetailRow>
          <DetailRow
            label="Repository"
            value={application.git_repository || "n/a"}
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
  linkValue: {
    fontSize: 13,
    color: colors.status.info,
    textDecorationLine: "underline",
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
