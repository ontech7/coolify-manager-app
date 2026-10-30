import { DetailRow } from "@/components/detail-row";
import { DetailTable } from "@/components/detail-table";
import { ModalHeader } from "@/components/modal-header";
import { RefreshErrorBanner } from "@/components/refresh-error-banner";
import {
  ServiceContainerRow,
  type ContainerAction,
} from "@/components/services/service-container-row";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { StatusBadge } from "@/components/ui/status-badge";
import { Text } from "@/components/ui/text";
import { useCoolifyApi } from "@/providers/coolify-api-provider";
import { colors, radius, spacing } from "@/theme";
import type { ServiceContainer, ServiceDetailResponse } from "@/types/api";
import { formatDateTime } from "@/utils/date";
import { getResourceStatus } from "@/utils/status";
import { MaterialIcons } from "@react-native-vector-icons/material-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ServiceDetailsModal() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { api, isConfigured, activeInstance } = useCoolifyApi();
  // Logs and per-container actions need Coolify >= 4.2.0.
  const isLegacy = activeInstance?.apiMode === "legacy";

  const [service, setService] = useState<ServiceDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchService = useCallback(
    async (showRefreshing = false) => {
      if (!uuid || !api) return;

      if (showRefreshing) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      try {
        if (!isConfigured) {
          setError("Not configured");
          return;
        }

        setService(await api.getService(uuid));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load service");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [uuid, api, isConfigured],
  );

  useEffect(() => {
    if (api) {
      fetchService();
    }
  }, [api, fetchService]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleRefresh = useCallback(() => {
    fetchService(true);
  }, [fetchService]);

  const name = service?.name;

  const handleViewLogs = useCallback(() => {
    router.push({
      pathname: "/logs/[uuid]",
      params: { uuid, type: "service", name },
    });
  }, [router, uuid, name]);

  const handleViewContainerLogs = useCallback(
    (container: ServiceContainer) => {
      router.push({
        pathname: "/logs/[uuid]",
        params: { uuid, type: "service", name, container: container.uuid },
      });
    },
    [router, uuid, name],
  );

  const applicationUuids = useMemo(
    () => new Set(service?.applications?.map((app) => app.uuid)),
    [service?.applications],
  );

  const handleContainerAction = useCallback(
    async (container: ServiceContainer, action: ContainerAction) => {
      if (!uuid || !api) return;
      const kind = applicationUuids.has(container.uuid)
        ? "application"
        : "database";
      await api.serviceContainerAction(uuid, kind, container.uuid, action);
      // Errors reach the row, which reports them; refresh only on success.
      fetchService(true);
    },
    [uuid, api, applicationUuids, fetchService],
  );

  const containers = useMemo(
    () => [...(service?.applications ?? []), ...(service?.databases ?? [])],
    [service?.applications, service?.databases],
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ModalHeader title="Service" onClose={handleClose} />
        <LoadingSpinner message="Loading service..." />
      </View>
    );
  }

  // A failed refresh keeps the loaded data and shows a banner instead.
  if (!service) {
    return (
      <View style={styles.container}>
        <ModalHeader title="Error" onClose={handleClose} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || "Service not found"}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ModalHeader title={service.name} onClose={handleClose}>
        <IconButton
          name="refresh"
          size={24}
          onPress={handleRefresh}
          loading={isRefreshing}
          accessibilityLabel="Refresh"
        />
      </ModalHeader>

      {error ? (
        <RefreshErrorBanner message={error} onRetry={handleRefresh} />
      ) : null}

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <View style={styles.statusRow}>
          <StatusBadge status={getResourceStatus(service.status)} />
        </View>

        {!isLegacy && containers.length > 0 && (
          <Button
            title="Logs"
            variant="secondary"
            adornmentStart={
              <MaterialIcons
                name="article"
                size={18}
                color={colors.primary.light}
              />
            }
            onPress={handleViewLogs}
            style={styles.actionButton}
          />
        )}

        <DetailTable>
          <DetailRow label="UUID" value={service.uuid} mono copyable />
          <DetailRow label="Type" value={service.service_type} />
          <DetailRow label="Description" value={service.description} />
          <DetailRow
            label="Created"
            value={
              service.created_at ? formatDateTime(service.created_at) : undefined
            }
          />
          <DetailRow
            label="Updated"
            value={
              service.updated_at ? formatDateTime(service.updated_at) : undefined
            }
          />
        </DetailTable>

        <Text style={styles.sectionTitle}>
          Containers{containers.length ? ` (${containers.length})` : ""}
        </Text>
        {containers.length > 0 ? (
          <View style={styles.containerList}>
            {containers.map((container, index) => (
              <ServiceContainerRow
                key={container.uuid}
                container={container}
                isLast={index === containers.length - 1}
                showActions={!isLegacy}
                onAction={handleContainerAction}
                onViewLogs={handleViewContainerLogs}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>This service has no containers.</Text>
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
  actionButton: {
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.surface.border,
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
  containerList: {
    backgroundColor: colors.surface.default,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  emptyText: {
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
