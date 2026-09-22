import { SERVER_ACTIONS_MIN_VERSION } from "@/constants";
import type {
  ApplicationDeploymentsResponse,
  ApplicationLogsResponse,
  ApplicationResponse,
  DatabaseResponse,
  DeploymentResponse,
  DeployResponse,
  MessageResponse,
  RollbackImagesResponse,
  RollbackResponse,
  ServerResource,
  ServerResponse,
  ServiceDetailResponse,
  ServiceResponse,
} from "@/types/api";
import type { ApiMode } from "@/types/config";

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

/** Non-2xx API response. Keeps the status so callers can tell a 404 apart. */
class HttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Coolify API wrapper
 * @docs https://coolify.io/docs/api-reference/api/operations/list-applications
 */
export class CoolifyAPI {
  private baseUrl: string;
  private token: string;
  private apiMode: ApiMode;

  constructor(baseUrl: string, token: string, apiMode: ApiMode = "current") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.token = token;
    this.apiMode = apiMode;
  }

  /**
   * HTTP method for state-changing actions. Coolify >= 4.2.0 requires POST;
   * older versions use GET.
   */
  private actionMethod(): "GET" | "POST" {
    return this.apiMode === "legacy" ? "GET" : "POST";
  }

  /**
   * Detect the Coolify server version (e.g. "4.2.0"). Returns null when the
   * version endpoint is unavailable (e.g. token without read permission).
   */
  async getVersion(): Promise<string | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/version`, {
        headers: this.headers,
        signal: controller.signal,
      });

      if (!response.ok) return null;

      return (await response.text()).replace(/^v/i, "").trim();
    } catch {
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const url = `${this.baseUrl}/api/v1${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...this.headers,
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const errorMessage =
          (error as { message?: string }).message ||
          `Status ${response.status}: ${response.statusText}`;
        throw new HttpError(errorMessage, response.status);
      }

      return (await response.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error(
            "Connection timeout. Server took too long to respond.",
          );
        }
        if (
          error.message === "Failed to fetch" ||
          error.message === "Network request failed"
        ) {
          throw new Error(
            "Unable to connect to server. Please check URL and connection.",
          );
        }
      }
      throw error;
    }
  }

  /**
   * For endpoints added in newer Coolify releases: an older server answers
   * with a generic 404, so turn it into an actionable message.
   */
  private async requestSince<T>(
    minVersion: string,
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<T> {
    try {
      return await this.request<T>(endpoint, options);
    } catch (error) {
      if (error instanceof HttpError && error.status === 404) {
        throw new Error(`This action requires Coolify ${minVersion} or newer.`);
      }
      throw error;
    }
  }

  async testConnection() {
    try {
      await this.request<ApplicationResponse[]>("/applications");
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getApplications() {
    return this.request<ApplicationResponse[]>("/applications");
  }

  async getApplication(uuid: string) {
    return this.request<ApplicationResponse>(`/applications/${uuid}`);
  }

  async startApplication(uuid: string) {
    await this.request<void>(`/applications/${uuid}/start`, {
      method: this.actionMethod(),
    });
  }

  async stopApplication(uuid: string) {
    await this.request<void>(`/applications/${uuid}/stop`, {
      method: this.actionMethod(),
    });
  }

  async restartApplication(uuid: string) {
    await this.request<void>(`/applications/${uuid}/restart`, {
      method: this.actionMethod(),
    });
  }

  /** `force` rebuilds without the Docker build cache. */
  async deployApplication(uuid: string, force: boolean = false) {
    if (this.apiMode === "legacy") {
      return this.request<DeployResponse>(
        `/deploy?uuid=${uuid}&force=${force}`,
      );
    }

    return this.request<DeployResponse>("/deploy", {
      method: "POST",
      body: JSON.stringify({ uuid, force }),
    });
  }

  async getApplicationLogs(uuid: string, lines: number = 100) {
    return this.request<ApplicationLogsResponse>(
      `/applications/${uuid}/logs?lines=${lines}`,
    );
  }

  async getRollbackImages(uuid: string) {
    return this.requestSince<RollbackImagesResponse>(
      SERVER_ACTIONS_MIN_VERSION,
      `/applications/${uuid}/rollback-images`,
    );
  }

  /** Queue a deployment of a previous image. `commit` is the image tag. */
  async rollbackApplication(uuid: string, commit: string) {
    return this.requestSince<RollbackResponse>(
      SERVER_ACTIONS_MIN_VERSION,
      `/applications/${uuid}/rollback`,
      { method: "POST", body: JSON.stringify({ commit }) },
    );
  }

  async getDeployments() {
    return this.request<DeploymentResponse[]>("/deployments");
  }

  async getDeploymentsByApp(uuid: string, skip: number = 0, take: number = 10) {
    return this.request<ApplicationDeploymentsResponse>(
      `/deployments/applications/${uuid}?skip=${skip}&take=${take}`,
    );
  }

  async getDeployment(uuid: string) {
    return this.request<DeploymentResponse>(`/deployments/${uuid}`);
  }

  async cancelDeployment(uuid: string) {
    await this.request<void>(`/deployments/${uuid}/cancel`, { method: "POST" });
  }

  // Databases

  async getDatabases() {
    return this.request<DatabaseResponse[]>("/databases");
  }

  async startDatabase(uuid: string) {
    await this.request<void>(`/databases/${uuid}/start`, {
      method: this.actionMethod(),
    });
  }

  async stopDatabase(uuid: string) {
    await this.request<void>(`/databases/${uuid}/stop`, {
      method: this.actionMethod(),
    });
  }

  async restartDatabase(uuid: string) {
    await this.request<void>(`/databases/${uuid}/restart`, {
      method: this.actionMethod(),
    });
  }

  /** Coolify >= 4.2.0 only. */
  async getDatabaseLogs(uuid: string, lines: number = 100) {
    return this.request<ApplicationLogsResponse>(
      `/databases/${uuid}/logs?lines=${lines}`,
    );
  }

  // Services

  async getServices() {
    return this.request<ServiceResponse[]>("/services");
  }

  /** Includes the service's sub-applications and sub-databases. */
  async getService(uuid: string) {
    return this.request<ServiceDetailResponse>(`/services/${uuid}`);
  }

  /**
   * Logs of one container of a service (Coolify >= 4.2.0). `subServiceName`
   * is the `name` of one of the service's applications or databases.
   */
  async getServiceLogs(
    uuid: string,
    subServiceName: string,
    lines: number = 100,
  ) {
    return this.request<ApplicationLogsResponse>(
      `/services/${uuid}/logs?sub_service_name=${encodeURIComponent(subServiceName)}&lines=${lines}`,
    );
  }

  async startService(uuid: string) {
    await this.request<void>(`/services/${uuid}/start`, {
      method: this.actionMethod(),
    });
  }

  async stopService(uuid: string) {
    await this.request<void>(`/services/${uuid}/stop`, {
      method: this.actionMethod(),
    });
  }

  async restartService(uuid: string) {
    await this.request<void>(`/services/${uuid}/restart`, {
      method: this.actionMethod(),
    });
  }

  async pullLatestImagesService(uuid: string) {
    await this.request<void>(`/services/${uuid}/restart?latest=true`, {
      method: this.actionMethod(),
    });
  }

  // Servers

  async getServers() {
    return this.request<ServerResponse[]>("/servers");
  }

  async getServer(uuid: string) {
    return this.request<ServerResponse>(`/servers/${uuid}`);
  }

  async getServerResources(uuid: string) {
    return this.request<ServerResource[]>(`/servers/${uuid}/resources`);
  }

  async validateServer(uuid: string) {
    await this.request<void>(`/servers/${uuid}/validate`, {
      method: this.actionMethod(),
    });
  }

  async restartProxy(uuid: string) {
    return this.requestSince<MessageResponse>(
      SERVER_ACTIONS_MIN_VERSION,
      `/servers/${uuid}/proxy/restart`,
      { method: "POST" },
    );
  }

  /** Removes unused images, build cache and stopped containers. */
  async runDockerCleanup(uuid: string) {
    return this.requestSince<MessageResponse>(
      SERVER_ACTIONS_MIN_VERSION,
      `/servers/${uuid}/docker-cleanup/run`,
      { method: "POST" },
    );
  }
}
