import { ErrorState } from "@/components/error-state";
import { RefreshErrorBanner } from "@/components/refresh-error-banner";
import { ServerCard } from "@/components/servers/server-card";
import { TabHeader } from "@/components/tab-header";
import {
  EmptyState,
  NotConfiguredEmptyState,
} from "@/components/ui/empty-state";
import { IconButton } from "@/components/ui/icon-button";
import { SkeletonList } from "@/components/ui/skeleton-list";
import { StaggeredItem } from "@/components/ui/staggered-item";
import { useServers } from "@/hooks/useServers";
import { colors, spacing } from "@/theme";
import type { ServerResponse } from "@/types/api";
import { useBottomTabBarHeight } from "expo-router/js-tabs";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";

export default function ServersScreen() {
  const router = useRouter();
  // The floating tab bar overlays the bottom of the screen.
  const tabBarHeight = useBottomTabBarHeight();
  const {
    servers,
    isLoading,
    isRefreshing,
    error,
    isConfigured,
    refresh,
    validate,
  } = useServers();

  const handleServerPress = useCallback(
    (uuid: string) => {
      router.push({ pathname: "/server/[uuid]", params: { uuid } });
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: ServerResponse; index: number }) => (
      <StaggeredItem index={index}>
        <ServerCard
          server={item}
          onValidate={validate}
          onPress={handleServerPress}
        />
      </StaggeredItem>
    ),
    [validate, handleServerPress],
  );

  const keyExtractor = useCallback((item: ServerResponse) => item.uuid, []);

  const handleGoToSettings = useCallback(() => {
    router.push("/settings");
  }, [router]);

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    if (!isConfigured) {
      return <NotConfiguredEmptyState onGoToSettings={handleGoToSettings} />;
    }
    return (
      <EmptyState
        icon="dns"
        title="No Servers"
        message="No servers found on your Coolify instance."
        actionLabel="Refresh"
        onAction={refresh}
      />
    );
  }, [isLoading, isConfigured, handleGoToSettings, refresh]);

  const subtitle = useMemo(() => {
    if (servers.length === 0) return "Health & connectivity";
    const unreachable = servers.filter((s) => !s.settings?.is_reachable).length;
    return unreachable > 0
      ? `${unreachable} of ${servers.length} unreachable`
      : `All ${servers.length} reachable`;
  }, [servers]);

  const header = (
    <TabHeader title="Servers" subtitle={subtitle}>
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
        <SkeletonList count={3} />
      </View>
    );
  }

  if (error && servers.length === 0) {
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

      {error && servers.length > 0 && (
        <RefreshErrorBanner message={error} onRetry={refresh} />
      )}

      <FlashList
        data={servers}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: tabBarHeight + spacing.xl },
          servers.length === 0 && styles.emptyList,
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
  list: {
    padding: spacing.xl,
  },
  fill: {
    flex: 1,
  },
  emptyList: {
    flex: 1,
  },
});
