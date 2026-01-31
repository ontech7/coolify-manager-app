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
