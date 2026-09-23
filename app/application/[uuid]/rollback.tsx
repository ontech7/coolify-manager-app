import { ErrorState } from "@/components/error-state";
import { ModalHeader } from "@/components/modal-header";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { StaggeredItem } from "@/components/ui/staggered-item";
import { Text } from "@/components/ui/text";
import { UnsupportedVersionError } from "@/lib/coolify-api";
import { triggerHaptic } from "@/lib/haptics";
import { useCoolifyApi } from "@/providers/coolify-api-provider";
import { colors, radius, spacing } from "@/theme";
import type { RollbackImage } from "@/types/api";
import { formatDockerDate } from "@/utils/date";
import { formatImageTag } from "@/utils/string";
import { MaterialIcons } from "@react-native-vector-icons/material-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Redeploy one of the Docker images Coolify still has for the application
 * (Coolify >= 4.3.0). Meant for "the last deploy broke production".
 */
export default function RollbackModal() {
  const { uuid, name } = useLocalSearchParams<{
    uuid: string;
    name?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { api, isInitializing } = useCoolifyApi();

  const [images, setImages] = useState<RollbackImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Retrying can't help on a server that predates rollback.
  const [isUnsupported, setIsUnsupported] = useState(false);
  const [rollingBackTag, setRollingBackTag] = useState<string | null>(null);

  const load = useCallback(async () => {
    // Wait for the provider; once it's ready, no API means no instance.
    if (isInitializing) return;
    if (!api || !uuid) {
      setError("Not configured");
      setIsLoading(false);
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const result = await api.getRollbackImages(uuid);
      setImages(result.images ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load images");
      setIsUnsupported(err instanceof UnsupportedVersionError);
    } finally {
      setIsLoading(false);
    }
  }, [api, uuid, isInitializing]);

  useEffect(() => {
    load();
  }, [load]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const rollback = useCallback(
    async (tag: string) => {
      if (!api || !uuid) return;
      setRollingBackTag(tag);
      try {
        const result = await api.rollbackApplication(uuid, tag);
        triggerHaptic("success");
        if (result.deployment_uuid) {
          router.replace({
            pathname: "/deployment/[uuid]",
            params: { uuid: result.deployment_uuid },
          });
        } else {
          Alert.alert("Rollback queued", result.message);
          router.back();
        }
      } catch (err) {
        triggerHaptic("error");
        Alert.alert(
          "Error",
          err instanceof Error ? err.message : "Failed to roll back",
        );
      } finally {
        setRollingBackTag(null);
      }
    },
    [api, uuid, router],
  );

  const handleSelect = useCallback(
    (image: RollbackImage) => {
      triggerHaptic("warning");
      Alert.alert(
        "Roll Back",
        `Redeploy ${name ? `"${name}" ` : ""}with image ${formatImageTag(image.tag)}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Roll Back",
            style: "destructive",
            onPress: () => rollback(image.tag),
          },
        ],
      );
    },
    [name, rollback],
  );

  return (
    <View style={styles.container}>
      <ModalHeader
        title={name ? `${name} · Rollback` : "Rollback"}
        onClose={handleClose}
      />

      {isLoading ? (
        <LoadingSpinner message="Loading images..." />
      ) : error && isUnsupported ? (
        <EmptyState
          icon="history"
          title="Rollback Unavailable"
          message={error}
        />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : images.length === 0 ? (
        <EmptyState
          icon="history"
          title="No Previous Images"
          message="Coolify has no older images of this application on the server. Images appear here after a few deployments."
        />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
        >
          <Text style={styles.hint}>
            Pick an image to redeploy. The current one is marked.
          </Text>
          <View style={styles.list}>
            {images.map((image, index) => {
              const isBusy = rollingBackTag !== null;
              return (
                <StaggeredItem key={image.tag} index={index}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.row,
                      index === images.length - 1 && styles.rowLast,
                      pressed && !image.is_current && styles.rowPressed,
                      isBusy &&
                        rollingBackTag !== image.tag &&
                        styles.rowDisabled,
                    ]}
                    onPress={() => handleSelect(image)}
                    disabled={image.is_current || isBusy}
                    accessibilityRole="button"
                    accessibilityLabel={`Image ${formatImageTag(image.tag)}, ${formatDockerDate(image.created_at)}`}
                    accessibilityHint={
                      image.is_current ? undefined : "Rolls back to this image"
                    }
                    accessibilityState={{
                      disabled: image.is_current || isBusy,
                      selected: image.is_current,
                      busy: rollingBackTag === image.tag,
                    }}
                  >
                    <View style={styles.rowInfo}>
                      <Text style={styles.tag} numberOfLines={1}>
                        {formatImageTag(image.tag)}
                      </Text>
                      <Text style={styles.date}>
                        {formatDockerDate(image.created_at)}
                      </Text>
                    </View>
                    {image.is_current ? (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentText}>Current</Text>
                      </View>
                    ) : rollingBackTag === image.tag ? (
                      <ActivityIndicator color={colors.primary.default} />
                    ) : (
                      <MaterialIcons
                        name="settings-backup-restore"
                        size={20}
                        color={colors.primary.light}
                      />
                    )}
                  </Pressable>
                </StaggeredItem>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: spacing.xl,
  },
  hint: {
    fontSize: 13,
    color: colors.text.muted,
    marginBottom: spacing.lg,
  },
  list: {
    backgroundColor: colors.surface.default,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowPressed: {
    backgroundColor: colors.surface.hover,
  },
  rowDisabled: {
    opacity: 0.4,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  tag: {
    fontFamily: "monospace",
    fontSize: 13,
    color: colors.primary.light,
  },
  date: {
    fontSize: 11,
    color: colors.text.disabled,
  },
  currentBadge: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.status.successBg,
  },
  currentText: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.status.success,
  },
});
