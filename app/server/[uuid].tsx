import { DetailRow } from "@/components/detail-row";
import { DetailTable } from "@/components/detail-table";
import { IconButton } from "@/components/ui/icon-button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { StatusBadge } from "@/components/ui/status-badge";
import { Text } from "@/components/ui/text";
import { triggerHaptic } from "@/hooks/useHaptics";
import { useCoolifyApi } from "@/providers/coolify-api-provider";
import { colors, radius, spacing } from "@/theme";
import type { ServerResource, ServerResponse } from "@/types/api";
import { getResourceStatus } from "@/utils/status";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function cleanResourceType(type: string): string {
  const last = type.split("\\").pop() ?? type;
  return last.replace(/^Standalone/, "");
}

function HealthPill({ ok, label }: { ok: boolean; label: string }) {
  const color = ok ? colors.status.success : colors.status.error;
  const bg = ok ? colors.status.successBg : colors.status.errorBg;
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

export default function ServerDetailsModal() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { api, isConfigured } = useCoolifyApi();

  const [server, setServer] = useState<ServerResponse | null>(null);
  const [resources, setResources] = useState<ServerResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
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

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LoadingSpinner message="Loading server..." />
      </View>
    );
  }

  if (error || !server) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Error</Text>
          <IconButton name="close" size={24} onPress={handleClose} />
        </View>
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
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {server.name}
        </Text>
        <View style={styles.headerActions}>
          <IconButton
            name="wifi-tethering"
            size={24}
            onPress={handleValidate}
            loading={isValidating}
          />
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
        <View style={styles.pills}>
          <HealthPill
            ok={reachable}
            label={reachable ? "Reachable" : "Unreachable"}
          />
          <HealthPill ok={usable} label={usable ? "Usable" : "Not usable"} />
        </View>

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
  pills: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "500",
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
