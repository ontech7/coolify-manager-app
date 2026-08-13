export const AUTO_REFRESH_INTERVAL = 5000; // 5 seconds

export const STORAGE_KEYS = {
  INSTANCES: "coolify_instances",
  ACTIVE_INSTANCE_ID: "coolify_active_instance_id",
  // Legacy keys
  LEGACY_SERVER_URL: "coolify_server_url",
  LEGACY_API_TOKEN: "coolify_api_token",
} as const;

export const GITHUB_REPO_URL = "https://github.com/ontech7/coolify-manager-app";

/**
 * Coolify version that switched state-changing API actions (start/stop/restart/
 * deploy/validate) from GET to POST. Servers >= this version require POST.
 */
export const POST_ACTIONS_MIN_VERSION = "4.2.0";
