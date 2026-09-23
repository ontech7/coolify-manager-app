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
