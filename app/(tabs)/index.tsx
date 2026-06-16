import { ResourceCard } from "@/components/resources/resource-card";
import { ErrorState } from "@/components/error-state";
import {
  EmptyState,
  NotConfiguredEmptyState,
} from "@/components/ui/empty-state";
import { IconButton } from "@/components/ui/icon-button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Text } from "@/components/ui/text";
import { useResources } from "@/hooks/useResources";
import { colors, radius, spacing } from "@/theme";
import type { Resource, ResourceType } from "@/types/api";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { FlashList } from "@shopify/flash-list";
import { useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FilterType = "all" | ResourceType;

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "application", label: "Apps" },
  { key: "database", label: "DBs" },
  { key: "service", label: "Services" },
];

export default function ResourcesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    resources,
    isLoading,
    isRefreshing,
    error,
    isConfigured,
    autoRefreshEnabled,
    refresh,
    toggleAutoRefresh,
    start,
    stop,
    restart,
    deploy,
    pullLatest,
  } = useResources();

  const [filter, setFilter] = useState<FilterType>("all");

  const rotation = useSharedValue(0);

  useEffect(() => {
    if (autoRefreshEnabled) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      cancelAnimation(rotation);
      rotation.value = 0;
    }
  }, [autoRefreshEnabled, rotation]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const filtered = useMemo(
    () =>
      filter === "all"
        ? resources
        : resources.filter((r) => r.resourceType === filter),
    [resources, filter],
  );

  const handleGoToSettings = useCallback(() => {
    router.push("/settings");
  }, [router]);

  const handleResourcePress = useCallback(
    (uuid: string) => {
      router.push(`/application/${uuid}` as Href);
    },
    [router],
  );

  const handleViewLogs = useCallback(
    (uuid: string) => {
      router.push(`/application/${uuid}/logs` as Href);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: Resource }) => (
      <ResourceCard
        resource={item}
        onPress={handleResourcePress}
        onDeploy={deploy}
        onPullLatest={pullLatest}
        onRestart={restart}
        onStart={start}
        onStop={stop}
        onViewLogs={handleViewLogs}
      />
    ),
    [
      handleResourcePress,
      deploy,
      pullLatest,
      restart,
      start,
      stop,
      handleViewLogs,
    ],
  );

  const keyExtractor = useCallback((item: Resource) => item.uuid, []);

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    if (!isConfigured) {
      return <NotConfiguredEmptyState onGoToSettings={handleGoToSettings} />;
    }
    return (
      <EmptyState
        icon="layers"
        title="No Resources"
        message="No applications, databases or services found on your Coolify server."
        actionLabel="Refresh"
        onAction={refresh}
      />
    );
  }, [isLoading, isConfigured, handleGoToSettings, refresh]);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LoadingSpinner message="Loading resources..." />
      </View>
    );
  }

  if (error && resources.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ErrorState message={error} onRetry={refresh} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.xl }]}>
        <View style={styles.titleGroup}>
          <Text style={styles.title}>Resources</Text>
          <Text style={styles.subtitle}>Apps, databases & services</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={[
              styles.autoRefreshButton,
              autoRefreshEnabled && styles.autoRefreshButtonActive,
            ]}
            onPress={toggleAutoRefresh}
          >
            <Animated.View style={autoRefreshEnabled && animatedIconStyle}>
              <MaterialIcons
                name="sync"
                size={14}
                color={
                  autoRefreshEnabled
                    ? colors.primary.default
                    : colors.text.muted
                }
              />
            </Animated.View>
            <Text
              style={[
                styles.autoRefreshText,
                autoRefreshEnabled && styles.autoRefreshTextActive,
              ]}
            >
              Auto
            </Text>
          </Pressable>
          <IconButton
            name="refresh"
            size={24}
            onPress={refresh}
            loading={isRefreshing}
          />
        </View>
      </View>

      {isConfigured && (
        <View style={styles.filters}>
          {FILTERS.map(({ key, label }) => {
            const active = filter === key;
            const count =
              key === "all"
                ? resources.length
                : resources.filter((r) => r.resourceType === key).length;
            return (
              <Pressable
                key={key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setFilter(key)}
              >
                <Text
                  style={[styles.filterText, active && styles.filterTextActive]}
                >
                  {label} {count}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <FlashList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.list,
          filtered.length === 0 && styles.emptyList,
        ]}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={colors.primary.default}
            colors={[colors.primary.default]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
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
  titleGroup: {
    gap: spacing.xs,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.text.muted,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  autoRefreshButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.surface.default,
  },
  autoRefreshButtonActive: {
    backgroundColor: colors.primary.background,
  },
  autoRefreshText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.text.muted,
  },
  autoRefreshTextActive: {
    color: colors.primary.default,
  },
  filters: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  filterChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.surface.default,
  },
  filterChipActive: {
    backgroundColor: colors.primary.background,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.text.muted,
  },
  filterTextActive: {
    color: colors.primary.light,
  },
  list: {
    padding: spacing.xl,
  },
  emptyList: {
    flex: 1,
  },
});
