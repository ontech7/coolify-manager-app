// General

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface TestConnectionResponse {
  success: boolean;
  error?: string;
}

// Deploy

export interface DeployResponse {
  message: string;
  deployment_uuid?: string;
}

// Application

export interface ApplicationResponse {
  uuid: string;
  name: string;
  type: string;
  status: ApplicationStatus;
  fqdn: string | null;
  git_repository: string | null;
  git_branch: string | null;
  build_pack: string | null;
  created_at: string;
  updated_at: string;
  is_running?: boolean;
  running?: boolean;
}

export type ApplicationStatus =
  | "running:healthy"
  | "running:unhealthy"
  | "exited:unhealthy"
  | "stopped"
  | "building"
  | "unknown";

export interface ApplicationLogsResponse {
  logs: string;
}

// Deployment

export interface DeploymentResponse {
  deployment_uuid: string;
  application_name: string;
  status: DeploymentStatus;
  server_name: string;
  commit: string | null;
  commit_message: string | null;
  git_type: string | null;
  is_webhook: boolean;
  is_api: boolean;
  force_rebuild: boolean;
  restart_only: boolean;
  created_at: string;
  updated_at: string;
}

export type DeploymentStatus =
  | "success"
  | "failed"
  | "in_progress"
  | "queued"
  | "cancelled";
