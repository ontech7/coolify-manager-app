import type {
  ApplicationDeploymentsResponse,
  ApplicationLogsResponse,
  ApplicationResponse,
  DatabaseResponse,
  DeploymentResponse,
  DeployResponse,
  ServerResource,
  ServerResponse,
  ServiceResponse,
} from "@/types/api";
import type { ApiMode } from "@/types/config";

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
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
        throw new Error(errorMessage);
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

  async deployApplication(uuid: string) {
    if (this.apiMode === "legacy") {
      return this.request<DeployResponse>(`/deploy?uuid=${uuid}`);
    }

    return this.request<DeployResponse>("/deploy", {
      method: "POST",
      body: JSON.stringify({ uuid }),
    });
  }

  async getApplicationLogs(uuid: string, lines: number = 100) {
    return this.request<ApplicationLogsResponse>(
      `/applications/${uuid}/logs?lines=${lines}`,
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

  // Services

  async getServices() {
    return this.request<ServiceResponse[]>("/services");
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
}
