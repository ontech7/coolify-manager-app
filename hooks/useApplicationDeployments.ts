import { useCoolifyApi } from "@/providers/coolify-api-provider";
import type { DeploymentResponse } from "@/types/api";
import { useCallback, useEffect, useState } from "react";

const PAGE_SIZE = 15;

type FetchMode = "initial" | "refresh" | "more";

/**
 * Paginated deployment history for a single application.
 * Backed by GET /deployments/applications/{uuid}?skip&take, which returns
 * past (completed/failed/cancelled) deployments as well as active ones.
 * The global /deployments endpoint only returns currently running ones.
 */
export function useApplicationDeployments(uuid: string | undefined) {
  const { api, isConfigured } = useCoolifyApi();

  const [deployments, setDeployments] = useState<DeploymentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (skip: number, mode: FetchMode) => {
      if (!api || !uuid) return;

      if (mode === "refresh") {
        setIsRefreshing(true);
      } else if (mode === "more") {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      try {
        const result = await api.getDeploymentsByApp(uuid, skip, PAGE_SIZE);
        const batch = result.deployments ?? [];
        setHasMore(skip + batch.length < (result.count ?? 0));
        setDeployments((prev) => (mode === "more" ? [...prev, ...batch] : batch));
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch deployments",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [api, uuid],
  );

  useEffect(() => {
    if (!isConfigured) {
      setDeployments([]);
      setError(null);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (api && uuid) {
      setIsLoading(true);
      fetchPage(0, "initial");
    }
  }, [api, uuid, isConfigured, fetchPage]);

  const refresh = useCallback(() => fetchPage(0, "refresh"), [fetchPage]);

  const loadMore = useCallback(() => {
    if (isLoading || isRefreshing || isLoadingMore || !hasMore) return;
    fetchPage(deployments.length, "more");
  }, [
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore,
    deployments.length,
    fetchPage,
  ]);

  const cancelDeployment = useCallback(
    async (deploymentUuid: string) => {
      if (!api) return;
      await api.cancelDeployment(deploymentUuid);
      await fetchPage(0, "refresh");
    },
    [api, fetchPage],
  );

  return {
    deployments,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore,
    error,
    isConfigured,
    refresh,
    loadMore,
    cancelDeployment,
  };
}
