import type {
  ApplicationLogsResponse,
  ApplicationResponse,
  DeploymentResponse,
  DeployResponse,
} from "@/types/api";

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

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.token = token;
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

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const errorMessage =
          (error as { message?: string }).message ||
          `Status ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error(
          "Unable to connect to server. Please check URL and connection.",
        );
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
    await this.request<void>(`/applications/${uuid}/start`);
  }

  async stopApplication(uuid: string) {
    await this.request<void>(`/applications/${uuid}/stop`);
  }

  async restartApplication(uuid: string) {
    await this.request<void>(`/applications/${uuid}/restart`);
  }

  async deployApplication(uuid: string) {
    return this.request<DeployResponse>(`/deploy?uuid=${uuid}`);
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
    return this.request<DeploymentResponse[]>(
      `/deployments/applications/${uuid}?skip=${skip}&take=${take}`,
    );
  }

  async getDeployment(uuid: string) {
    return this.request<DeploymentResponse>(`/deployments/${uuid}`);
  }

  async cancelDeployment(uuid: string) {
    await this.request<void>(`/deployments/${uuid}/cancel`, { method: "POST" });
  }
}
