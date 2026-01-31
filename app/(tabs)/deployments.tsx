import { DeploymentCard } from "@/components/deployments/deployment-card";
import { EmptyDeployments } from "@/components/deployments/empty-deployments";
import { ErrorState } from "@/components/error-state";
import { IconButton } from "@/components/ui/icon-button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Text } from "@/components/ui/text";
import { useDeployments } from "@/hooks/useDeployments";
import { colors, radius, spacing } from "@/theme";
import type { DeploymentResponse } from "@/types/api";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { FlashList } from "@shopify/flash-list";
import { useRouter, type Href } from "expo-router";
import { useCallback, useEffect } from "react";
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

export default function DeploymentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
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

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    return (
      <EmptyDeployments
        isConfigured={isConfigured}
        onGoToSettings={handleGoToSettings}
        onRefresh={refresh}
      />
    );
  }, [isLoading, isConfigured, handleGoToSettings, refresh]);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LoadingSpinner message="Loading deployments..." />
      </View>
    );
  }

  if (error && deployments.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ErrorState message={error} onRetry={refresh} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.xl }]}>
        <Text style={styles.title}>Deployments</Text>
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

      <FlashList
        data={deployments}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.list,
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text.primary,
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
  list: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyList: {
    flex: 1,
  },
});
