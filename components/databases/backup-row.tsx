import { IconButton } from "@/components/ui/icon-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Text } from "@/components/ui/text";
import { colors, spacing } from "@/theme";
import type { DatabaseBackup } from "@/types/api";
import { formatRelativeTime } from "@/utils/date";
import { getDeploymentStatus } from "@/utils/status";
import { formatBytes } from "@/utils/string";
import { useCallback } from "react";
import { StyleSheet, View } from "react-native";

interface BackupRowProps {
  backup: DatabaseBackup;
  isLast: boolean;
  /** Set while this backup is being started. */
  loading: boolean;
  disabled: boolean;
  onBackupNow: (backup: DatabaseBackup) => void;
}

/** A scheduled backup: its frequency, last run and a "back up now" button. */
export function BackupRow({
  backup,
  isLast,
  loading,
  disabled,
  onBackupNow,
}: BackupRowProps) {
  const lastRun = backup.executions?.[0];

  const handleBackupNow = useCallback(() => {
    onBackupNow(backup);
  }, [backup, onBackupNow]);

  return (
    <View style={[styles.row, isLast && styles.rowLast]}>
      <View style={styles.info}>
        <Text style={styles.frequency} numberOfLines={1}>
          {backup.frequency}
          {backup.save_s3 ? " · S3" : ""}
          {backup.enabled ? "" : " · Disabled"}
        </Text>
        {lastRun ? (
          <View style={styles.lastRun}>
            <StatusBadge status={getDeploymentStatus(lastRun.status)} />
            <Text style={styles.meta} numberOfLines={1}>
              {formatRelativeTime(lastRun.created_at)}
              {lastRun.size ? ` · ${formatBytes(lastRun.size)}` : ""}
            </Text>
          </View>
        ) : (
          <Text style={styles.meta}>Never run</Text>
        )}
      </View>
      <IconButton
        name="backup"
        accessibilityLabel="Back up now"
        size={16}
        variant="deploy"
        onPress={handleBackupNow}
        loading={loading}
        disabled={disabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  info: {
    flex: 1,
    gap: spacing.sm,
  },
  frequency: {
    fontFamily: "monospace",
    fontSize: 12,
    color: colors.primary.light,
  },
  lastRun: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  meta: {
    flexShrink: 1,
    fontSize: 11,
    color: colors.text.disabled,
  },
});
