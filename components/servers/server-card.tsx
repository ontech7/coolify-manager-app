import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import { Text } from "@/components/ui/text";
import { triggerHaptic } from "@/hooks/useHaptics";
import { colors, radius, spacing } from "@/theme";
import type { ServerResponse } from "@/types/api";
import { useCallback, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

interface ServerCardProps {
  server: ServerResponse;
  onValidate: (uuid: string) => Promise<void>;
  onPress: (uuid: string) => void;
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

export function ServerCard({ server, onValidate, onPress }: ServerCardProps) {
  const [isValidating, setIsValidating] = useState(false);

  const handlePress = useCallback(() => {
    onPress(server.uuid);
  }, [onPress, server.uuid]);

  const reachable = server.settings?.is_reachable ?? false;
  const usable = server.settings?.is_usable ?? false;

  const handleValidate = useCallback(() => {
    setIsValidating(true);
    onValidate(server.uuid)
      .then(() => triggerHaptic("success"))
      .catch((err: unknown) => {
        triggerHaptic("error");
        Alert.alert(
          "Error",
          err instanceof Error ? err.message : "Failed to validate server",
        );
      })
      .finally(() => setIsValidating(false));
  }, [server.uuid, onValidate]);

  const address = server.ip
    ? `${server.ip}${server.port ? `:${server.port}` : ""}`
    : "n/a";

  return (
    <Card style={{ marginBottom: spacing.lg }} onPress={handlePress}>
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {server.name}
          </Text>
          {server.description ? (
            <Text style={styles.description} numberOfLines={1}>
              {server.description}
            </Text>
          ) : null}
        </View>
        <IconButton
          name="wifi-tethering"
          size={20}
          variant="default"
          onPress={handleValidate}
          loading={isValidating}
        />
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.address} numberOfLines={1}>
          {server.user ? `${server.user}@` : ""}
          {address}
        </Text>
      </View>

      <View style={styles.pills}>
        <HealthPill ok={reachable} label={reachable ? "Reachable" : "Unreachable"} />
        <HealthPill ok={usable} label={usable ? "Usable" : "Not usable"} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  info: {
    flex: 1,
    marginRight: spacing.lg,
  },
  name: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text.primary,
  },
  description: {
    fontSize: 11,
    color: colors.text.disabled,
    marginTop: 2,
  },
  metaRow: {
    marginBottom: spacing.md,
  },
  address: {
    fontSize: 12,
    fontFamily: "monospace",
    color: colors.text.muted,
  },
  pills: {
    flexDirection: "row",
    gap: spacing.sm,
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
});
