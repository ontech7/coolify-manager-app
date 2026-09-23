import { useCoolifyApi } from "@/providers/coolify-api-provider";
import type { ServerResponse } from "@/types/api";
import { useCallback, useEffect, useRef, useState } from "react";

export function useServers() {
  const { api, isConfigured, isInitializing } = useCoolifyApi();

  const [servers, setServers] = useState<ServerResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Only the latest request may update state: an older one (e.g. from the
  // previous instance) can resolve after it.
  const requestIdRef = useRef(0);

  const fetchServers = useCallback(
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
        const result = await api.getServers();
        if (requestId !== requestIdRef.current) return;
        setServers(result.sort((a, b) => a.name.localeCompare(b.name)));
        setError(null);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setError(
          err instanceof Error ? err.message : "Failed to fetch servers",
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
    await fetchServers(true);
  }, [fetchServers]);

  const validate = useCallback(
    async (uuid: string) => {
      if (!api) return;
      await api.validateServer(uuid);
      await fetchServers();
    },
    [api, fetchServers],
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
      setServers([]);
      setError(null);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (api) {
      setIsLoading(true);
      fetchServers();
    }
  }, [api, isConfigured, isInitializing, fetchServers]);

  return {
    servers,
    isLoading,
    isRefreshing,
    error,
    isConfigured,
    refresh,
    validate,
  };
}
