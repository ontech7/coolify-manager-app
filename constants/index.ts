export const AUTO_REFRESH_INTERVAL = 5000; // 5 seconds

/** Faster polling while watching a deployment build live. */
export const LIVE_DEPLOYMENT_REFRESH_INTERVAL = 3000; // 3 seconds

export const LOG_LINES = 500;

/**
 * Distance from the bottom (px) within which a live log view keeps following
 * new lines. Scrolling further up pauses following so the user can read.
 */
export const SCROLL_FOLLOW_THRESHOLD = 80;

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

/**
 * Coolify version that added the rollback, proxy restart and Docker cleanup
 * endpoints. Older servers answer 404 on them.
 */
export const SERVER_ACTIONS_MIN_VERSION = "4.3.0";
