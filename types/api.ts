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
  logs?: string | null;
}

export type DeploymentStatus =
  | "success"
  | "failed"
  | "in_progress"
  | "queued"
  | "cancelled";

/**
 * Response of GET /deployments/applications/{uuid}. Coolify wraps the list in
 * an object with the total count (NOT a bare array).
 */
export interface ApplicationDeploymentsResponse {
  count: number;
  deployments: DeploymentResponse[];
}

// Databases
// The /databases endpoint returns standalone databases of various engines
// (postgresql, mysql, redis, ...). The OpenAPI spec types them loosely, so we
// only rely on the fields that are always present and read the rest defensively.

export interface DatabaseResponse {
  uuid: string;
  name: string;
  status?: string;
  description?: string | null;
  image?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Services

export interface ServiceResponse {
  uuid: string;
  name: string;
  status?: string;
  description?: string | null;
  service_type?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Servers

export interface ServerSettings {
  is_reachable?: boolean;
  is_usable?: boolean;
  is_build_server?: boolean;
}

export interface ServerResponse {
  uuid: string;
  name: string;
  description?: string | null;
  ip?: string;
  port?: number;
  user?: string;
  settings?: ServerSettings;
}

export interface ServerResource {
  uuid: string;
  name: string;
  type: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

// Unified resource (application | database | service)

export type ResourceType = "application" | "database" | "service";

export interface Resource {
  uuid: string;
  name: string;
  status?: string;
  resourceType: ResourceType;
  subtitle?: string | null;
  /** Applications only — used for the "open website" action. */
  fqdn?: string | null;
}
