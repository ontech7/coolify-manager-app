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

/** Hides the password of a connection URL: "postgres://u:secret@h" → "postgres://u:•••@h". */
export function maskUrlPassword(url: string) {
  // Greedy up to the last "@": an unencoded password may contain one.
  return url.replace(/^([a-z0-9+.-]+:\/\/[^:/@]*:).*@/i, "$1•••@");
}
