import { useCoolifyApi } from "@/providers/coolify-api-provider";
import type { DeploymentResponse } from "@/types/api";
import { useCallback, useEffect, useRef, useState } from "react";

const PAGE_SIZE = 15;

type FetchMode = "initial" | "refresh" | "more";

/**
 * Paginated deployment history for a single application.
 * Backed by GET /deployments/applications/{uuid}?skip&take, which returns
 * past (completed/failed/cancelled) deployments as well as active ones.
 * The global /deployments endpoint only returns currently running ones.
 */
export function useApplicationDeployments(uuid: string | undefined) {
  const { api, isConfigured, isInitializing } = useCoolifyApi();

  const [deployments, setDeployments] = useState<DeploymentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Only the latest request may update state: a refresh supersedes a page
  // still loading, and an instance switch supersedes everything.
  const requestIdRef = useRef(0);

  const fetchPage = useCallback(
    async (skip: number, mode: FetchMode) => {
      if (!api || !uuid) return;

      const requestId = ++requestIdRef.current;
      if (mode === "refresh") {
        setIsRefreshing(true);
      } else if (mode === "more") {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      try {
        const result = await api.getDeploymentsByApp(uuid, skip, PAGE_SIZE);
        if (requestId !== requestIdRef.current) return;
        const batch = result.deployments ?? [];
        setHasMore(skip + batch.length < (result.count ?? 0));
        setDeployments((prev) =>
          mode === "more" ? [...prev, ...batch] : batch,
        );
        setError(null);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setError(
          err instanceof Error ? err.message : "Failed to fetch deployments",
        );
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
          setIsLoadingMore(false);
        }
      }
    },
    [api, uuid],
  );

  useEffect(() => {
    // In-flight requests belong to the previous instance.
    requestIdRef.current++;

    // Still reading the config: show the spinner, not "Not configured".
    if (isInitializing) {
      setIsLoading(true);
      return;
    }

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
  }, [api, uuid, isConfigured, isInitializing, fetchPage]);

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
