import type {
  ApplicationResponse,
  ApplicationStatus,
  DeploymentStatus,
} from "@/types/api";

export function getApplicationStatus(
  app: ApplicationResponse,
): ApplicationStatus {
  return getResourceStatus(app.status);
}

/**
 * Normalizes a raw Coolify status string (e.g. "running:healthy",
 * "exited:unhealthy") into one of our known status types. Works for any
 * resource kind (application, database, service) since they share the format.
 */
export function getResourceStatus(rawStatus?: string): ApplicationStatus {
  const status = rawStatus?.toLowerCase() ?? "";

  if (status === "building") {
    return "building";
  }

  if (status.includes("stopped")) {
    return "stopped";
  }

  if (status.includes("exited") && status.includes("unhealthy")) {
    return "exited:unhealthy";
  }

  if (status.includes("exited")) {
    return "stopped";
  }

  if (status.includes("running") && status.includes("unhealthy")) {
    return "running:unhealthy";
  }

  if (status.includes("running") && status.includes("healthy")) {
    return "running:healthy";
  }

  if (status.includes("running")) {
    return "running:healthy";
  }

  if (status.includes("healthy")) {
    return "running:healthy";
  }

  return "unknown";
}

export function isApplicationRunning(app: ApplicationResponse) {
  return isResourceRunning(app.status);
}

export function isResourceRunning(rawStatus?: string) {
  return (rawStatus?.toLowerCase() ?? "").includes("running");
}

/**
 * Normalizes a raw Coolify deployment status into one of our known types.
 * Coolify reports a completed deployment as "finished" (not "success"), so a
 * naive mapping shows "Unknown" once a deploy succeeds.
 */
export function getDeploymentStatus(
  rawStatus?: string,
): DeploymentStatus | "unknown" {
  const s = rawStatus?.toLowerCase() ?? "";

  if (s === "finished" || s === "success" || s === "completed") {
    return "success";
  }
  if (s === "failed" || s === "error") {
    return "failed";
  }
  if (s.includes("cancel")) {
    return "cancelled";
  }
  if (
    s === "in_progress" ||
    s === "running" ||
    s === "building" ||
    s === "deploying"
  ) {
    return "in_progress";
  }
  if (s === "queued" || s === "pending") {
    return "queued";
  }
  return "unknown";
}

export function isDeploymentActive(rawStatus?: string) {
  const status = getDeploymentStatus(rawStatus);
  return status === "in_progress" || status === "queued";
}

export function canCancelDeployment(rawStatus?: string) {
  return isDeploymentActive(rawStatus);
}
