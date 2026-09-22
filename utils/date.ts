import { format, formatDistanceToNow, parseISO } from "date-fns";

// Format a date string to relative time (e.g., "2 hours ago")
export function formatRelativeTime(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return "Unknown";
  }
}

// Format a date string to a readable format (e.g., "Jan 15, 2024 14:30")
export function formatDateTime(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, "MMM d, yyyy HH:mm");
  } catch {
    return "Unknown";
  }
}

// Format a date string to date only (e.g., "Jan 15, 2024")
export function formatDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, "MMM d, yyyy");
  } catch {
    return "Unknown";
  }
}

// Format a date string to time only (e.g., "14:30")
export function formatTime(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, "HH:mm");
  } catch {
    return "Unknown";
  }
}

// Docker prints dates as "2025-01-15 10:30:00 +0000 UTC". Returns relative
// time (e.g., "3 days ago"), or the raw value when it isn't in that format.
export function formatDockerDate(raw: string | null | undefined): string {
  if (!raw) return "";
  const match = raw.match(
    /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) ([+-]\d{2})(\d{2})/,
  );
  if (!match) return raw;
  const iso = `${match[1]}T${match[2]}${match[3]}:${match[4]}`;
  const relative = formatRelativeTime(iso);
  return relative === "Unknown" ? raw : relative;
}
