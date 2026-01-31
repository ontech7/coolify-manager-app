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
