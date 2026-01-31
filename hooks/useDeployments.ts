import { AUTO_REFRESH_INTERVAL } from "@/constants";
import { useCoolifyApi } from "@/providers/coolify-api-provider";
import type { DeploymentResponse } from "@/types/api";
import { useCallback, useEffect, useRef, useState } from "react";

export function useDeployments() {
  const { api, isConfigured } = useCoolifyApi();

  const [deployments, setDeployments] = useState<DeploymentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchDeployments = useCallback(
    async (showRefreshing = false) => {
      if (!api) {
        setIsLoading(false);
        return;
      }

      if (showRefreshing) {
        setIsRefreshing(true);
      }

      try {
        const deps = await api.getDeployments();
        const sorted = deps.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        setDeployments(sorted);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch deployments",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
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
  }, [api, isConfigured, fetchDeployments]);

  useEffect(() => {
    if (!autoRefreshEnabled || !isConfigured) {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      return;
    }

    let cancelled = false;

    const scheduleRefresh = () => {
      refreshTimerRef.current = setTimeout(async () => {
        await fetchDeployments();
        if (cancelled) {
          return;
        }
        scheduleRefresh();
      }, AUTO_REFRESH_INTERVAL);
    };

    scheduleRefresh();

    return () => {
      cancelled = true;
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [autoRefreshEnabled, isConfigured, fetchDeployments]);

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
