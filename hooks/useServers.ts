import { useCoolifyApi } from "@/providers/coolify-api-provider";
import type { ServerResponse } from "@/types/api";
import { useCallback, useEffect, useState } from "react";

export function useServers() {
  const { api, isConfigured } = useCoolifyApi();

  const [servers, setServers] = useState<ServerResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServers = useCallback(
    async (showRefreshing = false) => {
      if (!api) {
        setIsLoading(false);
        return;
      }

      if (showRefreshing) {
        setIsRefreshing(true);
      }

      try {
        const result = await api.getServers();
        setServers(result.sort((a, b) => a.name.localeCompare(b.name)));
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch servers",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
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
  }, [api, isConfigured, fetchServers]);

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
