import { DeploymentCard } from "@/components/deployments/deployment-card";
import { ErrorState } from "@/components/error-state";
import { IconButton } from "@/components/ui/icon-button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Text } from "@/components/ui/text";
import { useApplicationDeployments } from "@/hooks/useApplicationDeployments";
import { colors, spacing } from "@/theme";
import type { DeploymentResponse } from "@/types/api";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, RefreshControl, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ApplicationDeploymentsModal() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const router = useRouter();

  const insets = useSafeAreaInsets();

  const {
    deployments,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore,
    error,
    refresh,
    loadMore,
    cancelDeployment,
  } = useApplicationDeployments(uuid);

  const appName = deployments[0]?.application_name;

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleDeploymentPress = useCallback(
    (deploymentUuid: string) => {
      router.push(`/deployment/${deploymentUuid}` as Href);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: DeploymentResponse }) => (
      <DeploymentCard
        deployment={item}
        onPress={handleDeploymentPress}
        onCancel={cancelDeployment}
      />
    ),
    [handleDeploymentPress, cancelDeployment],
  );

  const keyExtractor = useCallback(
    (item: DeploymentResponse) => item.deployment_uuid,
    [],
  );

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator color={colors.primary.default} />
      </View>
    );
  }, [isLoadingMore]);

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    return (
      <View style={styles.empty}>
        <MaterialIcons
          name="history"
          size={48}
          color={colors.primary.default}
          style={styles.emptyIcon}
        />
        <Text style={styles.emptyTitle}>No Deployment History</Text>
        <Text style={styles.emptyMessage}>
          This application hasn&apos;t been deployed yet. Past deployments will
          appear here once you deploy it.
        </Text>
      </View>
    );
  }, [isLoading]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {appName ? `${appName} — History` : "Deployment History"}
        </Text>
        <View style={styles.headerActions}>
          <IconButton
            name="refresh"
            size={24}
            onPress={refresh}
            loading={isRefreshing}
          />
          <IconButton name="close" size={24} onPress={handleClose} />
        </View>
      </View>

      {isLoading ? (
        <LoadingSpinner message="Loading deployment history..." />
      ) : error && deployments.length === 0 ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : (
        <FlashList
          data={deployments}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={[
            styles.list,
            deployments.length === 0 && styles.emptyList,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={0.5}
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  list: {
    padding: spacing.xl,
  },
  emptyList: {
    flex: 1,
  },
  footer: {
    paddingVertical: spacing.xl,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing["3xl"],
  },
  emptyIcon: {
    marginBottom: spacing.xl,
    opacity: 0.8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  emptyMessage: {
    fontSize: 14,
    color: colors.text.muted,
    textAlign: "center",
    lineHeight: 20,
  },
});
