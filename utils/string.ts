export function isNotEmpty(value: string) {
  return value.trim().length > 0;
}

export function truncateCommit(commit: string | null) {
  if (!commit) {
    return "";
  }
  return commit.substring(0, 7);
}

export function truncateMessage(
  message: string | null,
  maxLength: number = 50,
) {
  if (!message) {
    return "";
  }
  if (message.length <= maxLength) {
    return message;
  }
  return `${message.substring(0, maxLength)}...`;
}

/** The last `count` lines of a multi-line string. */
export function lastLines(text: string, count: number) {
  const lines = text.split("\n");
  return lines.length > count ? lines.slice(-count).join("\n") : text;
}

/** Docker image tags are often full commit SHAs: shorten those like commits. */
export function formatImageTag(tag: string) {
  return /^[0-9a-f]{40}$/i.test(tag) ? truncateCommit(tag) : tag;
}

/** Human-readable size, e.g. 1536 → "1.5 KB". */
export function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${unit === 0 ? value : value.toFixed(1)} ${units[unit]}`;
}

/**
 * Hides the password of a connection URL: "postgres://u:secret@h" → "postgres://u:•••@h".
 * On Redis it hides all the credentials: Coolify also builds "redis://secret@h",
 * for Redis older than 6, where the only part is the password, and a password
 * with a ":" in it reads just like "user:password".
 */
export function maskUrlPassword(url: string) {
  // The last "@": an unencoded password may contain one.
  const at = url.lastIndexOf("@");
  if (at === -1) {
    return url;
  }

  const scheme = url.match(/^[^/:@]+:\/\//)?.[0] ?? "";
  const credentials = url.slice(scheme.length, at);
  const username = /^rediss?:/i.test(scheme)
    ? ""
    : credentials.slice(0, credentials.indexOf(":") + 1);
  return `${scheme}${username}•••${url.slice(at)}`;
}
