import { ErrorState } from "@/components/error-state";
import { RefreshErrorBanner } from "@/components/refresh-error-banner";
import { ResourceCard } from "@/components/resources/resource-card";
import { StatusSummary } from "@/components/resources/status-summary";
import { TabHeader } from "@/components/tab-header";
import { AutoRefreshButton } from "@/components/ui/auto-refresh-button";
import { Chip } from "@/components/ui/chip";
import {
  EmptyState,
  NotConfiguredEmptyState,
} from "@/components/ui/empty-state";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { SkeletonList } from "@/components/ui/skeleton-list";
import { StaggeredItem } from "@/components/ui/staggered-item";
import { useResources } from "@/hooks/useResources";
import { useCoolifyApi } from "@/providers/coolify-api-provider";
import { colors, motion, spacing } from "@/theme";
import type { Resource, ResourceType } from "@/types/api";
import { useBottomTabBarHeight } from "expo-router/js-tabs";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

type FilterType = "all" | ResourceType;

const FILTERS: { key: FilterType; label: string; searchLabel: string }[] = [
  { key: "all", label: "All", searchLabel: "resources" },
  { key: "application", label: "Apps", searchLabel: "applications" },
  { key: "database", label: "DBs", searchLabel: "databases" },
  { key: "service", label: "Services", searchLabel: "services" },
];

const toolbarEntering = FadeIn.duration(motion.duration.normal);

export default function ResourcesScreen() {
  const router = useRouter();
  // The floating tab bar overlays the bottom of the screen.
  const tabBarHeight = useBottomTabBarHeight();
  const { activeInstance } = useCoolifyApi();
  // Database and service logs were added to the API in Coolify 4.2.0.
  const supportsResourceLogs = activeInstance?.apiMode !== "legacy";
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
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const result: Record<FilterType, number> = {
      all: resources.length,
      application: 0,
      database: 0,
      service: 0,
    };
    for (const resource of resources) result[resource.resourceType]++;
    return result;
  }, [resources]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter(
      (r) =>
        (filter === "all" || r.resourceType === filter) &&
        (!q ||
          r.name.toLowerCase().includes(q) ||
          (r.subtitle?.toLowerCase().includes(q) ?? false)),
    );
  }, [resources, filter, query]);

  // Cards animate in only for the first loaded list: after a filter, search
  // or refresh, FlashList recycles some cells and mounts others, so only part
  // of the list would animate. Adjusted during render, so the first
  // non-empty commit already has it.
  const [entranceData, setEntranceData] = useState<Resource[] | null>(null);
  if (entranceData === null && filtered.length > 0) setEntranceData(filtered);
  const animateEntrance = filtered === entranceData;

  const handleOpenSearch = useCallback(() => {
    setIsSearching(true);
  }, []);

  const handleCloseSearch = useCallback(() => {
    setIsSearching(false);
    setQuery("");
  }, []);

  const handleClearFilters = useCallback(() => {
    handleCloseSearch();
    setFilter("all");
  }, [handleCloseSearch]);

  const handleGoToSettings = useCallback(() => {
    router.push("/settings");
  }, [router]);

  const handleResourcePress = useCallback(
    (uuid: string) => {
      router.push({ pathname: "/application/[uuid]", params: { uuid } });
    },
    [router],
  );

  const handleViewLogs = useCallback(
    (resource: Resource) => {
      router.push({
        pathname: "/logs/[uuid]",
        params: {
          uuid: resource.uuid,
          type: resource.resourceType,
          name: resource.name,
        },
      });
    },
    [router],
  );

  const handleOpenDeployment = useCallback(
    (deploymentUuid: string) => {
      router.push({
        pathname: "/deployment/[uuid]",
        params: { uuid: deploymentUuid },
      });
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Resource; index: number }) => (
      <StaggeredItem index={index} animate={animateEntrance}>
        <ResourceCard
          resource={item}
          supportsResourceLogs={supportsResourceLogs}
          onPress={handleResourcePress}
          onDeploy={deploy}
          onPullLatest={pullLatest}
          onRestart={restart}
          onStart={start}
          onStop={stop}
          onViewLogs={handleViewLogs}
          onOpenDeployment={handleOpenDeployment}
        />
      </StaggeredItem>
    ),
    [
      animateEntrance,
      supportsResourceLogs,
      handleResourcePress,
      deploy,
      pullLatest,
      restart,
      start,
      stop,
      handleViewLogs,
      handleOpenDeployment,
    ],
  );

  const keyExtractor = useCallback((item: Resource) => item.uuid, []);

  // Apps render a pressable card, others a plain one: keep recycling per type.
  const getItemType = useCallback((item: Resource) => item.resourceType, []);

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    if (!isConfigured) {
      return <NotConfiguredEmptyState onGoToSettings={handleGoToSettings} />;
    }
    if (resources.length > 0) {
      return (
        <EmptyState
          icon="search-off"
          title="No Matches"
          message="Nothing matches the current filter or search."
          actionLabel="Clear Filters"
          onAction={handleClearFilters}
        />
      );
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
  }, [
    isLoading,
    isConfigured,
    resources.length,
    handleGoToSettings,
    handleClearFilters,
    refresh,
  ]);

  const header = (
    <TabHeader
      title="Resources"
      subtitle={
        isConfigured && !isLoading ? (
          <StatusSummary resources={resources} />
        ) : (
          "Apps, databases & services"
        )
      }
    >
      <AutoRefreshButton
        enabled={autoRefreshEnabled}
        onToggle={toggleAutoRefresh}
      />
      <IconButton
        name="refresh"
        size={24}
        onPress={refresh}
        loading={isRefreshing}
        accessibilityLabel="Refresh"
      />
    </TabHeader>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        {header}
        {/* Same offset as the toolbar, so the list doesn't jump when loaded. */}
        {isConfigured && <View style={styles.toolbar} />}
        <SkeletonList style={isConfigured && styles.skeletonBelowToolbar} />
      </View>
    );
  }

  if (error && resources.length === 0) {
    return (
      <View style={styles.container}>
        {header}
        <View style={[styles.fill, { paddingBottom: tabBarHeight }]}>
          <ErrorState message={error} onRetry={refresh} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {header}

      {isConfigured && (
        <View style={styles.toolbar}>
          {isSearching ? (
            <Animated.View entering={toolbarEntering} style={styles.toolbarRow}>
              <Input
                placeholder={`Search ${FILTERS.find((f) => f.key === filter)?.searchLabel}…`}
                value={query}
                onChangeText={setQuery}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                maxFontSizeMultiplier={1.25}
                containerStyle={styles.searchInput}
              />
              <IconButton
                name="close"
                size={22}
                color={colors.text.muted}
                onPress={handleCloseSearch}
                accessibilityLabel="Close search"
              />
            </Animated.View>
          ) : (
            <Animated.View entering={toolbarEntering} style={styles.toolbarRow}>
              <ScrollView
                horizontal
                style={styles.filters}
                contentContainerStyle={styles.filtersContent}
                showsHorizontalScrollIndicator={false}
              >
                {FILTERS.map(({ key, label }) => (
                  <Chip
                    key={key}
                    label={`${label} ${counts[key]}`}
                    active={filter === key}
                    onPress={() => setFilter(key)}
                  />
                ))}
              </ScrollView>
              <IconButton
                name="search"
                size={22}
                color={colors.text.muted}
                onPress={handleOpenSearch}
                accessibilityLabel="Search"
              />
            </Animated.View>
          )}
        </View>
      )}

      {error && resources.length > 0 && (
        <RefreshErrorBanner message={error} onRetry={refresh} />
      )}

      <FlashList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: tabBarHeight + spacing.xl },
          filtered.length === 0 && styles.emptyList,
        ]}
        ListEmptyComponent={renderEmpty}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
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
  toolbar: {
    // Touch-target height; grows with large system fonts.
    minHeight: 44,
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    justifyContent: "center",
  },
  toolbarRow: {
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  filters: {
    flex: 1,
    alignSelf: "stretch",
  },
  filtersContent: {
    alignItems: "center",
    gap: spacing.sm,
  },
  skeletonBelowToolbar: {
    paddingTop: spacing.md,
  },
  searchInput: {
    flex: 1,
  },
  list: {
    padding: spacing.xl,
    paddingTop: spacing.md,
  },
  fill: {
    flex: 1,
  },
  emptyList: {
    flex: 1,
  },
});
