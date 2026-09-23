import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { useCoolifyApi } from "@/providers/coolify-api-provider";
import type { DeploymentResponse } from "@/types/api";
import { useCallback, useEffect, useRef, useState } from "react";

export function useDeployments() {
  const { api, isConfigured, isInitializing } = useCoolifyApi();

  const [deployments, setDeployments] = useState<DeploymentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Only the latest request may update state: an older one (e.g. from the
  // previous instance) can resolve after it.
  const requestIdRef = useRef(0);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  const fetchDeployments = useCallback(
    async (showRefreshing = false) => {
      if (!api) {
        setIsLoading(false);
        return;
      }

      const requestId = ++requestIdRef.current;
      if (showRefreshing) {
        setIsRefreshing(true);
      }

      try {
        const deps = await api.getDeployments();
        if (requestId !== requestIdRef.current) return;
        const sorted = deps.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        setDeployments(sorted);
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
        }
      }
    },
    [api],
  );

  const refresh = useCallback(async () => {
    await fetchDeployments(true);
  }, [fetchDeployments]);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled((prev) => !prev);
  }, []);

  const cancelDeployment = useCallback(
    async (uuid: string) => {
      if (!api) return;
      await api.cancelDeployment(uuid);
      await fetchDeployments();
    },
    [api, fetchDeployments],
  );

  useEffect(() => {
    // In-flight requests belong to the previous instance.
    requestIdRef.current++;

    // Still reading the config: show the skeleton, not "Not configured".
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

    if (api) {
      setIsLoading(true);
      fetchDeployments();
    }
  }, [api, isConfigured, isInitializing, fetchDeployments]);

  useAutoRefresh(fetchDeployments, autoRefreshEnabled && isConfigured);

  return {
    deployments,
    isLoading,
    isRefreshing,
    error,
    isConfigured,
    autoRefreshEnabled,
    refresh,
    toggleAutoRefresh,
    cancelDeployment,
  };
}
