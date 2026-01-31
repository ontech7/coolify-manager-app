import { AUTO_REFRESH_INTERVAL } from "@/constants";
import { useCoolifyApi } from "@/providers/coolify-api-provider";
import type { ApplicationResponse } from "@/types/api";
import { useCallback, useEffect, useRef, useState } from "react";

export function useApplications() {
  const { api, isConfigured } = useCoolifyApi();

  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchApplications = useCallback(
    async (showRefreshing = false) => {
      if (!api) {
        setIsLoading(false);
        return;
      }

      if (showRefreshing) {
        setIsRefreshing(true);
      }

      try {
        const apps = await api.getApplications();
        setApplications(apps);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch applications",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [api],
  );

  const refresh = useCallback(async () => {
    await fetchApplications(true);
  }, [fetchApplications]);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled((prev) => !prev);
  }, []);

  const startApplication = useCallback(
    async (uuid: string) => {
      if (!api) return;
      await api.startApplication(uuid);
      await fetchApplications();
    },
    [api, fetchApplications],
  );

  const stopApplication = useCallback(
    async (uuid: string) => {
      if (!api) return;
      await api.stopApplication(uuid);
      await fetchApplications();
    },
    [api, fetchApplications],
  );

  const restartApplication = useCallback(
    async (uuid: string) => {
      if (!api) return;
      await api.restartApplication(uuid);
      await fetchApplications();
    },
    [api, fetchApplications],
  );

  const deployApplication = useCallback(
    async (uuid: string) => {
      if (!api) return;
      await api.deployApplication(uuid);
      await fetchApplications();
    },
    [api, fetchApplications],
  );

  useEffect(() => {
    if (!isConfigured) {
      setApplications([]);
      setError(null);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (api) {
      setIsLoading(true);
      fetchApplications();
    }
  }, [api, isConfigured, fetchApplications]);

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
        await fetchApplications();
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
  }, [autoRefreshEnabled, isConfigured, fetchApplications]);

  return {
    applications,
    isLoading,
    isRefreshing,
    error,
    isConfigured,
    autoRefreshEnabled,
    refresh,
    toggleAutoRefresh,
    startApplication,
    stopApplication,
    restartApplication,
    deployApplication,
  };
}
