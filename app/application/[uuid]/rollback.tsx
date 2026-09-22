import { EmptyState } from "@/components/ui/empty-state";
import { IconButton } from "@/components/ui/icon-button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { StaggeredItem } from "@/components/ui/staggered-item";
import { Text } from "@/components/ui/text";
import { triggerHaptic } from "@/hooks/useHaptics";
import { useCoolifyApi } from "@/providers/coolify-api-provider";
import { colors, radius, spacing } from "@/theme";
import type { RollbackImage } from "@/types/api";
import { formatDockerDate } from "@/utils/date";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
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

/** Commit SHAs are 40 hex chars; show them short like elsewhere in the app. */
function formatTag(tag: string) {
  return /^[0-9a-f]{40}$/i.test(tag) ? tag.slice(0, 7) : tag;
}

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
  const { api } = useCoolifyApi();

  const [images, setImages] = useState<RollbackImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rollingBackTag, setRollingBackTag] = useState<string | null>(null);

  useEffect(() => {
    if (!api || !uuid) return;

    api
      .getRollbackImages(uuid)
      .then((result) => setImages(result.images ?? []))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load images"),
      )
      .finally(() => setIsLoading(false));
  }, [api, uuid]);

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
          router.replace(`/deployment/${result.deployment_uuid}` as Href);
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
        `Redeploy ${name ? `"${name}" ` : ""}with image ${formatTag(image.tag)}?`,
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
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {name ? `${name} · Rollback` : "Rollback"}
        </Text>
        <IconButton name="close" size={24} onPress={handleClose} />
      </View>

      {isLoading ? (
        <LoadingSpinner message="Loading images..." />
      ) : error ? (
        <EmptyState
          icon="history"
          title="Rollback unavailable"
          message={error}
        />
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
            {images.map((image, index) => (
              <StaggeredItem key={image.tag} index={index}>
                <Pressable
                  style={({ pressed }) => [
                    styles.row,
                    index === images.length - 1 && styles.rowLast,
                    pressed && !image.is_current && styles.rowPressed,
                  ]}
                  onPress={() => handleSelect(image)}
                  disabled={image.is_current || rollingBackTag !== null}
                >
                  <View style={styles.rowInfo}>
                    <Text style={styles.tag} numberOfLines={1}>
                      {formatTag(image.tag)}
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
            ))}
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
