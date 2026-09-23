import { PENDING_ACTION_TIMEOUT } from "@/constants";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { useCoolifyApi } from "@/providers/coolify-api-provider";
import type {
  DatabaseResponse,
  DeploymentResponse,
  Resource,
  ResourcePending,
  ResourceType,
  ServiceResponse,
} from "@/types/api";
import { isResourceRunning } from "@/utils/status";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type PendingMap = Record<string, ResourcePending>;

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
 * Drops the pending entries Coolify has caught up with: a deployment that is no
 * longer queued/in progress, a start that now reports running, a stop that no
 * longer does (or either timed out). `activeDeployments` is null when unknown,
 * which keeps deployments.
 * Returns the same object when nothing changed, to skip a re-render.
 */
function prunePending(
  pending: PendingMap,
  resources: Resource[],
  activeDeployments: DeploymentResponse[] | null,
): PendingMap {
  const activeUuids = activeDeployments
    ? new Set(activeDeployments.map((d) => d.deployment_uuid))
    : null;
  const now = Date.now();
  const next: PendingMap = {};
  let changed = false;

  for (const [uuid, entry] of Object.entries(pending)) {
    let done: boolean;
    if (entry.kind === "deploying") {
      done = activeUuids !== null && !activeUuids.has(entry.deploymentUuid);
    } else {
      // Missing when its list failed to load this time: keep waiting.
      const resource = resources.find((r) => r.uuid === uuid);
      done =
        now - entry.since > PENDING_ACTION_TIMEOUT ||
        (resource !== undefined &&
          isResourceRunning(resource.status) === (entry.kind === "starting"));
    }

    if (done) changed = true;
    else next[uuid] = entry;
  }

  return changed ? next : pending;
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
  // Mirrored in a ref so fetchResources can read it without re-creating
  // itself (and restarting auto-refresh) on every change.
  const [pending, setPending] = useState<PendingMap>({});
  const pendingRef = useRef(pending);

  const updatePending = useCallback(
    (update: (prev: PendingMap) => PendingMap) => {
      const next = update(pendingRef.current);
      if (next === pendingRef.current) return;
      pendingRef.current = next;
      setPending(next);
    },
    [],
  );

  const markPending = useCallback(
    (uuid: string, entry: ResourcePending) => {
      updatePending((prev) => ({ ...prev, [uuid]: entry }));
    },
    [updatePending],
  );

  const fetchResources = useCallback(
    async (showRefreshing = false) => {
      if (!api) {
        setIsLoading(false);
        return;
      }

      if (showRefreshing) {
        setIsRefreshing(true);
      }

      // Only poll deployments while one started from the app is pending.
      const hasDeploying = Object.values(pendingRef.current).some(
        (p) => p.kind === "deploying",
      );

      try {
        const [apps, dbs, svcs, active] = await Promise.allSettled([
          api.getApplications(),
          api.getDatabases(),
          api.getServices(),
          hasDeploying ? api.getDeployments() : Promise.resolve(null),
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
        updatePending((prev) =>
          prunePending(
            prev,
            merged,
            active.status === "fulfilled" ? active.value : null,
          ),
        );

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
    [api, updatePending],
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
      if (type === "application") {
        const deploymentUuid = await api.startApplication(uuid);
        if (deploymentUuid) {
          markPending(uuid, { kind: "deploying", deploymentUuid });
        }
      } else {
        if (type === "database") await api.startDatabase(uuid);
        else await api.startService(uuid);
        markPending(uuid, { kind: "starting", since: Date.now() });
      }
      await fetchResources();
    },
    [api, fetchResources, markPending],
  );

  const stop = useCallback(
    async (uuid: string, type: ResourceType) => {
      if (!api) return;
      if (type === "application") await api.stopApplication(uuid);
      else if (type === "database") await api.stopDatabase(uuid);
      else await api.stopService(uuid);
      markPending(uuid, { kind: "stopping", since: Date.now() });
      await fetchResources();
    },
    [api, fetchResources, markPending],
  );

  const restart = useCallback(
    async (uuid: string, type: ResourceType) => {
      if (!api) return;
      if (type === "application") {
        const deploymentUuid = await api.restartApplication(uuid);
        if (deploymentUuid) {
          markPending(uuid, { kind: "deploying", deploymentUuid });
        }
      } else if (type === "database") await api.restartDatabase(uuid);
      else await api.restartService(uuid);
      await fetchResources();
    },
    [api, fetchResources, markPending],
  );

  /** Returns the queued deployment's UUID, when Coolify reports one. */
  const deploy = useCallback(
    async (uuid: string, force: boolean = false) => {
      if (!api) return undefined;
      const result = await api.deployApplication(uuid, force);
      const deploymentUuid = result.deployments?.[0]?.deployment_uuid;
      if (deploymentUuid) {
        markPending(uuid, { kind: "deploying", deploymentUuid });
      }
      await fetchResources();
      return deploymentUuid;
    },
    [api, fetchResources, markPending],
  );

  const pullLatest = useCallback(
    async (uuid: string) => {
      if (!api) return;
      await api.pullLatestImagesService(uuid);
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

  useAutoRefresh(fetchResources, autoRefreshEnabled && isConfigured);

  // Resources without a pending action are passed through untouched.
  const resourcesWithPending = useMemo(
    () =>
      resources.map((r) =>
        pending[r.uuid] ? { ...r, pending: pending[r.uuid] } : r,
      ),
    [resources, pending],
  );

  return {
    resources: resourcesWithPending,
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
    pullLatest,
  };
}
