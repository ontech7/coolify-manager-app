/**
 * API compatibility mode for a Coolify server.
 * "legacy" = < 4.2.0 (state-changing actions use GET), "current" = >= 4.2.0 (POST).
 */
export type ApiMode = "legacy" | "current";

export interface CoolifyInstance {
  id: string;
  name: string;
  serverUrl: string;
  apiToken: string;
  /** API compatibility mode. Optional so instances stored before this field still parse. */
  apiMode?: ApiMode;
}

export interface AppConfig {
  instances: CoolifyInstance[];
  activeInstanceId: string | null;
}
