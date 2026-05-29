import { AUTO_REFRESH_INTERVAL } from "@/constants";
import { useCoolifyApi } from "@/providers/coolify-api-provider";
import type {
  DatabaseResponse,
  Resource,
  ResourceType,
  ServiceResponse,
} from "@/types/api";
import { useCallback, useEffect, useRef, useState } from "react";

function databaseToResource(db: DatabaseResponse): Resource {
  return {
    uuid: db.uuid,
    name: db.name,
    status: db.status,
    resourceType: "database",
    subtitle: db.image || "Database",
  };
}

function serviceToResource(svc: ServiceResponse): Resource {
  return {
    uuid: svc.uuid,
    name: svc.name,
    status: svc.status,
    resourceType: "service",
    subtitle: svc.service_type || "Service",
  };
}

/**
 * Unified view over all deployable resources on the Coolify instance:
 * applications, databases and services. Each list is fetched independently so
 * a failure in one type still surfaces the others.
 */
export function useResources() {
  const { api, isConfigured } = useCoolifyApi();

  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchResources = useCallback(
    async (showRefreshing = false) => {
      if (!api) {
        setIsLoading(false);
        return;
      }

      if (showRefreshing) {
        setIsRefreshing(true);
      }

      try {
        const [apps, dbs, svcs] = await Promise.allSettled([
          api.getApplications(),
          api.getDatabases(),
          api.getServices(),
        ]);

        const merged: Resource[] = [];

        if (apps.status === "fulfilled") {
          merged.push(
            ...apps.value.map<Resource>((a) => ({
              uuid: a.uuid,
              name: a.name,
              status: a.status,
              resourceType: "application",
              subtitle: a.build_pack || a.type,
              fqdn: a.fqdn,
            })),
          );
        }
        if (dbs.status === "fulfilled") {
          merged.push(...dbs.value.map(databaseToResource));
        }
        if (svcs.status === "fulfilled") {
          merged.push(...svcs.value.map(serviceToResource));
        }

        merged.sort((a, b) => a.name.localeCompare(b.name));
        setResources(merged);

        const allFailed = [apps, dbs, svcs].every(
          (r) => r.status === "rejected",
        );
        if (allFailed) {
          const reason = (apps as PromiseRejectedResult).reason;
          setError(
            reason instanceof Error
              ? reason.message
              : "Failed to fetch resources",
          );
        } else {
          setError(null);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch resources",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [api],
  );

  const refresh = useCallback(async () => {
    await fetchResources(true);
  }, [fetchResources]);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled((prev) => !prev);
  }, []);

  const start = useCallback(
    async (uuid: string, type: ResourceType) => {
      if (!api) return;
      if (type === "application") await api.startApplication(uuid);
      else if (type === "database") await api.startDatabase(uuid);
      else await api.startService(uuid);
      await fetchResources();
    },
    [api, fetchResources],
  );

  const stop = useCallback(
    async (uuid: string, type: ResourceType) => {
      if (!api) return;
      if (type === "application") await api.stopApplication(uuid);
      else if (type === "database") await api.stopDatabase(uuid);
      else await api.stopService(uuid);
      await fetchResources();
    },
    [api, fetchResources],
  );

  const restart = useCallback(
    async (uuid: string, type: ResourceType) => {
      if (!api) return;
      if (type === "application") await api.restartApplication(uuid);
      else if (type === "database") await api.restartDatabase(uuid);
      else await api.restartService(uuid);
      await fetchResources();
    },
    [api, fetchResources],
  );

  const deploy = useCallback(
    async (uuid: string) => {
      if (!api) return;
      await api.deployApplication(uuid);
      await fetchResources();
    },
    [api, fetchResources],
  );

  useEffect(() => {
    if (!isConfigured) {
      setResources([]);
      setError(null);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (api) {
      setIsLoading(true);
      fetchResources();
    }
  }, [api, isConfigured, fetchResources]);

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
        await fetchResources();
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
  }, [autoRefreshEnabled, isConfigured, fetchResources]);

  return {
    resources,
    isLoading,
    isRefreshing,
    error,
    isConfigured,
    autoRefreshEnabled,
    refresh,
    toggleAutoRefresh,
    start,
    stop,
    restart,
    deploy,
  };
}
