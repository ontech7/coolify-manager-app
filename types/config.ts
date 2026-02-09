export interface CoolifyInstance {
  id: string;
  name: string;
  serverUrl: string;
  apiToken: string;
}

export interface AppConfig {
  instances: CoolifyInstance[];
  activeInstanceId: string | null;
}
