import { ErrorState } from "@/components/error-state";
import { ServerCard } from "@/components/servers/server-card";
import {
  EmptyState,
  NotConfiguredEmptyState,
} from "@/components/ui/empty-state";
import { IconButton } from "@/components/ui/icon-button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Text } from "@/components/ui/text";
import { useServers } from "@/hooks/useServers";
import { colors, spacing } from "@/theme";
import type { ServerResponse } from "@/types/api";
import { FlashList } from "@shopify/flash-list";
import { useRouter, type Href } from "expo-router";
import { useCallback } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ServersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
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
      router.push(`/server/${uuid}` as Href);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: ServerResponse }) => (
      <ServerCard
        server={item}
        onValidate={validate}
        onPress={handleServerPress}
      />
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

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LoadingSpinner message="Loading servers..." />
      </View>
    );
  }

  if (error && servers.length === 0) {
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
          <Text style={styles.title}>Servers</Text>
          <Text style={styles.subtitle}>Health & connectivity</Text>
        </View>
        <IconButton
          name="refresh"
          size={24}
          onPress={refresh}
          loading={isRefreshing}
        />
      </View>

      <FlashList
        data={servers}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.list,
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
  list: {
    padding: spacing.xl,
  },
  emptyList: {
    flex: 1,
  },
});
