import type {
  ApplicationResponse,
  ApplicationStatus,
  DeploymentStatus,
} from "@/types/api";

export function getApplicationStatus(
  app: ApplicationResponse,
): ApplicationStatus {
  const status = app.status?.toLowerCase() ?? "";

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
  const status = app.status?.toLowerCase() ?? "";
  return status.includes("running");
}

export function isDeploymentActive(status: DeploymentStatus) {
  return status === "in_progress" || status === "queued";
}

export function canCancelDeployment(status: DeploymentStatus) {
  return status === "in_progress" || status === "queued";
}
