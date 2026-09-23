import {
  POST_ACTIONS_MIN_VERSION,
  REQUEST_TIMEOUT,
  RESPONSE_BODY_TIMEOUT,
  SERVER_ACTIONS_MIN_VERSION,
} from "@/constants";
import type {
  ApplicationDeploymentsResponse,
  ApplicationLogsResponse,
  ApplicationResponse,
  DatabaseResponse,
  DeploymentResponse,
  DeployResponse,
  MessageResponse,
  QueuedDeploymentResponse,
  RollbackImagesResponse,
  ServerResource,
  ServerResponse,
  ServiceDetailResponse,
  ServiceResponse,
} from "@/types/api";
import type { ApiMode } from "@/types/config";

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

/** The endpoint is missing on this server: it needs a newer Coolify. */
export class UnsupportedVersionError extends Error {
  constructor(minVersion: string) {
    super(`This action requires Coolify ${minVersion} or newer.`);
  }
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
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

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
    let timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...this.headers,
          ...options.headers,
        },
      });

      // The body gets its own, longer budget: a server can send headers and
      // then stall, but large logs also need time on a slow connection.
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => controller.abort(), RESPONSE_BODY_TIMEOUT);
      const body = await response.text();

      if (!response.ok) {
        let message: string | undefined;
        try {
          message = (JSON.parse(body) as { message?: string }).message;
        } catch {
          // Not JSON: fall back to the status.
        }
        const status = response.statusText
          ? `Status ${response.status}: ${response.statusText}`
          : `Status ${response.status}`; // HTTP/2 has no status text
        throw new HttpError(message || status, response.status);
      }

      try {
        return JSON.parse(body) as T;
      } catch {
        // e.g. an HTML login page from an auth proxy, a wrong base path, or an
        // empty body: Coolify always answers with JSON.
        throw new Error(
          "Unexpected response from server. Check the URL — is it behind a login page or proxy?",
        );
      }
    } catch (error) {
      // expo/fetch rejects an aborted request with a generic FetchError,
      // not an AbortError, so check the signal instead.
      if (controller.signal.aborted) {
        throw new Error("Connection timeout. Server took too long to respond.");
      }
      if (error instanceof Error) {
        if (
          error.message === "Failed to fetch" ||
          error.message === "Network request failed" ||
          error.message.startsWith("fetch failed")
        ) {
          throw new Error(
            "Unable to connect to server. Please check URL and connection.",
          );
        }
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * For endpoints added in newer Coolify releases: an older server answers
   * unknown routes with a generic `404 "Not found."`, so turn that into an
   * actionable message. Specific 404s ("Application not found.") pass through.
   */
  private async requestSince<T>(
    minVersion: string,
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<T> {
    try {
      return await this.request<T>(endpoint, options);
    } catch (error) {
      if (
        error instanceof HttpError &&
        error.status === 404 &&
        error.message === "Not found."
      ) {
        throw new UnsupportedVersionError(minVersion);
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
    return this.request<ApplicationResponse>(
      `/applications/${encodeURIComponent(uuid)}`,
    );
  }

  /** Returns the queued deployment's UUID, when Coolify reports one. */
  async startApplication(uuid: string) {
    const result = await this.request<QueuedDeploymentResponse | null>(
      `/applications/${encodeURIComponent(uuid)}/start`,
      { method: this.actionMethod() },
    );
    return result?.deployment_uuid;
  }

  async stopApplication(uuid: string) {
    await this.request<void>(`/applications/${encodeURIComponent(uuid)}/stop`, {
      method: this.actionMethod(),
    });
  }

  /** Returns the queued deployment's UUID, when Coolify reports one. */
  async restartApplication(uuid: string) {
    const result = await this.request<QueuedDeploymentResponse | null>(
      `/applications/${encodeURIComponent(uuid)}/restart`,
      { method: this.actionMethod() },
    );
    return result?.deployment_uuid;
  }

  /** `force` rebuilds without the Docker build cache. */
  async deployApplication(uuid: string, force: boolean = false) {
    // Only send `force` when set: older servers read the raw query string,
    // and PHP casts "false" to true.
    if (this.apiMode === "legacy") {
      return this.request<DeployResponse>(
        `/deploy?uuid=${encodeURIComponent(uuid)}${force ? "&force=true" : ""}`,
      );
    }

    return this.request<DeployResponse>("/deploy", {
      method: "POST",
      body: JSON.stringify(force ? { uuid, force } : { uuid }),
    });
  }

  async getApplicationLogs(uuid: string, lines: number = 100) {
    return this.request<ApplicationLogsResponse>(
      `/applications/${encodeURIComponent(uuid)}/logs?lines=${lines}`,
    );
  }

  async getRollbackImages(uuid: string) {
    return this.requestSince<RollbackImagesResponse>(
      SERVER_ACTIONS_MIN_VERSION,
      `/applications/${encodeURIComponent(uuid)}/rollback-images`,
    );
  }

  /** Queue a deployment of a previous image. `commit` is the image tag. */
  async rollbackApplication(uuid: string, commit: string) {
    return this.requestSince<QueuedDeploymentResponse>(
      SERVER_ACTIONS_MIN_VERSION,
      `/applications/${encodeURIComponent(uuid)}/rollback`,
      { method: "POST", body: JSON.stringify({ commit }) },
    );
  }

  async getDeployments() {
    return this.request<DeploymentResponse[]>("/deployments");
  }

  async getDeploymentsByApp(uuid: string, skip: number = 0, take: number = 10) {
    return this.request<ApplicationDeploymentsResponse>(
      `/deployments/applications/${encodeURIComponent(uuid)}?skip=${skip}&take=${take}`,
    );
  }

  async getDeployment(uuid: string) {
    return this.request<DeploymentResponse>(
      `/deployments/${encodeURIComponent(uuid)}`,
    );
  }

  async cancelDeployment(uuid: string) {
    await this.request<void>(
      `/deployments/${encodeURIComponent(uuid)}/cancel`,
      { method: "POST" },
    );
  }

  // Databases

  async getDatabases() {
    return this.request<DatabaseResponse[]>("/databases");
  }

  async startDatabase(uuid: string) {
    await this.request<void>(`/databases/${encodeURIComponent(uuid)}/start`, {
      method: this.actionMethod(),
    });
  }

  async stopDatabase(uuid: string) {
    await this.request<void>(`/databases/${encodeURIComponent(uuid)}/stop`, {
      method: this.actionMethod(),
    });
  }

  async restartDatabase(uuid: string) {
    await this.request<void>(`/databases/${encodeURIComponent(uuid)}/restart`, {
      method: this.actionMethod(),
    });
  }

  /** Coolify >= 4.2.0 only. */
  async getDatabaseLogs(uuid: string, lines: number = 100) {
    return this.requestSince<ApplicationLogsResponse>(
      POST_ACTIONS_MIN_VERSION,
      `/databases/${encodeURIComponent(uuid)}/logs?lines=${lines}`,
    );
  }

  // Services

  async getServices() {
    return this.request<ServiceResponse[]>("/services");
  }

  /** Includes the service's sub-applications and sub-databases. */
  async getService(uuid: string) {
    return this.request<ServiceDetailResponse>(
      `/services/${encodeURIComponent(uuid)}`,
    );
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
    return this.requestSince<ApplicationLogsResponse>(
      POST_ACTIONS_MIN_VERSION,
      `/services/${encodeURIComponent(uuid)}/logs?sub_service_name=${encodeURIComponent(subServiceName)}&lines=${lines}`,
    );
  }

  async startService(uuid: string) {
    await this.request<void>(`/services/${encodeURIComponent(uuid)}/start`, {
      method: this.actionMethod(),
    });
  }

  async stopService(uuid: string) {
    await this.request<void>(`/services/${encodeURIComponent(uuid)}/stop`, {
      method: this.actionMethod(),
    });
  }

  async restartService(uuid: string) {
    await this.request<void>(`/services/${encodeURIComponent(uuid)}/restart`, {
      method: this.actionMethod(),
    });
  }

  async pullLatestImagesService(uuid: string) {
    await this.request<void>(
      `/services/${encodeURIComponent(uuid)}/restart?latest=true`,
      {
        method: this.actionMethod(),
      },
    );
  }

  // Servers

  async getServers() {
    return this.request<ServerResponse[]>("/servers");
  }

  async getServer(uuid: string) {
    return this.request<ServerResponse>(`/servers/${encodeURIComponent(uuid)}`);
  }

  async getServerResources(uuid: string) {
    return this.request<ServerResource[]>(
      `/servers/${encodeURIComponent(uuid)}/resources`,
    );
  }

  async validateServer(uuid: string) {
    await this.request<void>(`/servers/${encodeURIComponent(uuid)}/validate`, {
      method: this.actionMethod(),
    });
  }

  async restartProxy(uuid: string) {
    return this.requestSince<MessageResponse>(
      SERVER_ACTIONS_MIN_VERSION,
      `/servers/${encodeURIComponent(uuid)}/proxy/restart`,
      { method: "POST" },
    );
  }

  /** Removes unused images, build cache and stopped containers. */
  async runDockerCleanup(uuid: string) {
    return this.requestSince<MessageResponse>(
      SERVER_ACTIONS_MIN_VERSION,
      `/servers/${encodeURIComponent(uuid)}/docker-cleanup/run`,
      { method: "POST" },
    );
  }
}
