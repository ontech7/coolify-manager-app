import { BackupRow } from "@/components/databases/backup-row";
import { DetailRow } from "@/components/detail-row";
import { DetailTable } from "@/components/detail-table";
import { ModalHeader } from "@/components/modal-header";
import { RefreshErrorBanner } from "@/components/refresh-error-banner";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { StatusBadge } from "@/components/ui/status-badge";
import { Text } from "@/components/ui/text";
import { triggerHaptic } from "@/lib/haptics";
import { useCoolifyApi } from "@/providers/coolify-api-provider";
import { colors, radius, spacing } from "@/theme";
import type { DatabaseBackup, DatabaseDetailResponse } from "@/types/api";
import { formatDateTime } from "@/utils/date";
import { getResourceStatus } from "@/utils/status";
import { maskUrlPassword } from "@/utils/string";
import { MaterialIcons } from "@react-native-vector-icons/material-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DatabaseDetailsModal() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { api, isConfigured, activeInstance } = useCoolifyApi();
  // Logs and backups need Coolify >= 4.2.0.
  const isLegacy = activeInstance?.apiMode === "legacy";

  const [database, setDatabase] = useState<DatabaseDetailResponse | null>(
    null,
  );
  const [backups, setBackups] = useState<DatabaseBackup[]>([]);
  const [backupsError, setBackupsError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [runningBackup, setRunningBackup] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDatabase = useCallback(
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

        const [db, bk] = await Promise.allSettled([
          api.getDatabase(uuid),
          isLegacy ? Promise.resolve([]) : api.getDatabaseBackups(uuid),
        ]);

        if (db.status === "fulfilled") setDatabase(db.value);
        else throw db.reason;

        if (bk.status === "fulfilled") {
          setBackups(bk.value);
          setBackupsError(null);
        } else {
          setBackups([]);
          setBackupsError(
            bk.reason instanceof Error
              ? bk.reason.message
              : "Failed to load backups",
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load database");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [uuid, api, isConfigured, isLegacy],
  );

  useEffect(() => {
    if (api) {
      fetchDatabase();
    }
  }, [api, fetchDatabase]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleRefresh = useCallback(() => {
    fetchDatabase(true);
  }, [fetchDatabase]);

  const name = database?.name;

  const handleViewLogs = useCallback(() => {
    router.push({
      pathname: "/logs/[uuid]",
      params: { uuid, type: "database", name },
    });
  }, [router, uuid, name]);

  const runBackup = useCallback(
    async (backup: DatabaseBackup) => {
      if (!uuid || !api) return;
      setRunningBackup(backup.uuid);
      try {
        await api.runDatabaseBackup(uuid, backup.uuid);
        triggerHaptic("success");
        Alert.alert(
          "Backup started",
          "Refresh in a moment to see how it went.",
        );
      } catch (err) {
        triggerHaptic("error");
        Alert.alert(
          "Error",
          err instanceof Error ? err.message : "Failed to start backup",
        );
      } finally {
        setRunningBackup(null);
      }
    },
    [uuid, api],
  );

  const handleBackupNow = useCallback(
    (backup: DatabaseBackup) => {
      triggerHaptic("warning");
      Alert.alert("Back Up Now", `Start a backup of "${name}" now?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Back Up", onPress: () => runBackup(backup) },
      ]);
    },
    [name, runBackup],
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ModalHeader title="Database" onClose={handleClose} />
        <LoadingSpinner message="Loading database..." />
      </View>
    );
  }

  // A failed refresh keeps the loaded data and shows a banner instead.
  if (!database) {
    return (
      <View style={styles.container}>
        <ModalHeader title="Error" onClose={handleClose} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || "Database not found"}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ModalHeader title={database.name} onClose={handleClose}>
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
          <StatusBadge status={getResourceStatus(database.status)} />
        </View>

        {!isLegacy && (
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
          <DetailRow label="UUID" value={database.uuid} mono copyable />
          <DetailRow
            label="Engine"
            value={database.database_type?.replace(/^standalone-/, "")}
          />
          <DetailRow label="Image" value={database.image} mono />
          <DetailRow label="Description" value={database.description} />
          <DetailRow
            label="Internal URL"
            value={database.internal_db_url}
            displayValue={
              database.internal_db_url
                ? maskUrlPassword(database.internal_db_url)
                : undefined
            }
            copyable
          />
          <DetailRow
            label="Public URL"
            value={database.external_db_url}
            displayValue={
              database.external_db_url
                ? maskUrlPassword(database.external_db_url)
                : undefined
            }
            copyable
          />
          <DetailRow
            label="Public Port"
            value={
              database.is_public && database.public_port
                ? String(database.public_port)
                : undefined
            }
          />
          <DetailRow
            label="Created"
            value={
              database.created_at
                ? formatDateTime(database.created_at)
                : undefined
            }
          />
          <DetailRow
            label="Updated"
            value={
              database.updated_at
                ? formatDateTime(database.updated_at)
                : undefined
            }
          />
        </DetailTable>

        {!database.internal_db_url && (
          <Text style={styles.hint}>
            Connection URLs need an API token with the read:sensitive
            permission.
          </Text>
        )}

        {!isLegacy && (
          <>
            <Text style={styles.sectionTitle}>
              Backups{backups.length ? ` (${backups.length})` : ""}
            </Text>
            {backupsError ? (
              <Text style={styles.sectionError}>{backupsError}</Text>
            ) : backups.length > 0 ? (
              <View style={styles.backupList}>
                {backups.map((backup, index) => (
                  <BackupRow
                    key={backup.uuid}
                    backup={backup}
                    isLast={index === backups.length - 1}
                    loading={runningBackup === backup.uuid}
                    disabled={runningBackup !== null}
                    onBackupNow={handleBackupNow}
                  />
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>
                No scheduled backups. Set one up in Coolify.
              </Text>
            )}
          </>
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
  hint: {
    fontSize: 12,
    color: colors.text.disabled,
    marginTop: spacing.md,
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
  sectionError: {
    fontSize: 13,
    color: colors.status.error,
  },
  backupList: {
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
