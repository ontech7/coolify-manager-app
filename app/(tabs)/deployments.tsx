import { DeploymentCard } from "@/components/deployments/deployment-card";
import { ErrorState } from "@/components/error-state";
import { TabHeader } from "@/components/tab-header";
import { AutoRefreshButton } from "@/components/ui/auto-refresh-button";
import {
  EmptyState,
  NotConfiguredEmptyState,
} from "@/components/ui/empty-state";
import { IconButton } from "@/components/ui/icon-button";
import { SkeletonList } from "@/components/ui/skeleton-list";
import { StaggeredItem } from "@/components/ui/staggered-item";
import { useDeployments } from "@/hooks/useDeployments";
import { colors, spacing } from "@/theme";
import type { DeploymentResponse } from "@/types/api";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { FlashList } from "@shopify/flash-list";
import { useRouter, type Href } from "expo-router";
import { useCallback } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";

export default function DeploymentsScreen() {
  const router = useRouter();
  // The floating tab bar overlays the bottom of the screen.
  const tabBarHeight = useBottomTabBarHeight();
  const {
    deployments,
    isLoading,
    isRefreshing,
    error,
    isConfigured,
    autoRefreshEnabled,
    refresh,
    toggleAutoRefresh,
    cancelDeployment,
  } = useDeployments();

  const handleGoToSettings = useCallback(() => {
    router.push("/settings");
  }, [router]);

  const handleDeploymentPress = useCallback(
    (uuid: string) => {
      router.push(`/deployment/${uuid}` as Href);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: DeploymentResponse; index: number }) => (
      <StaggeredItem index={index}>
        <DeploymentCard
          deployment={item}
          onPress={handleDeploymentPress}
          onCancel={cancelDeployment}
        />
      </StaggeredItem>
    ),
    [handleDeploymentPress, cancelDeployment],
  );

  const keyExtractor = useCallback(
    (item: DeploymentResponse) => item.deployment_uuid,
    [],
  );

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    if (!isConfigured) {
      return <NotConfiguredEmptyState onGoToSettings={handleGoToSettings} />;
    }
    return (
      <EmptyState
        icon="rocket"
        title="No Active Deployments"
        message="Nothing is deploying right now. This tab shows active and in-progress deployments. To see past deployments, open an application and tap the history icon."
        actionLabel="Refresh"
        onAction={refresh}
      />
    );
  }, [isLoading, isConfigured, handleGoToSettings, refresh]);

  const header = (
    <TabHeader
      title="Deployments"
      subtitle={
        deployments.length > 0
          ? `${deployments.length} active`
          : "Active & in progress"
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

  if (error && deployments.length === 0) {
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

      <FlashList
        data={deployments}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: tabBarHeight + spacing.xl },
          deployments.length === 0 && styles.emptyList,
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
