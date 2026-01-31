import { isNotEmpty } from "./string";

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateServerUrl(url: string) {
  if (!isNotEmpty(url)) {
    return "Server URL is required";
  }

  if (!isValidUrl(url)) {
    return "Please enter a valid URL (e.g.: https://coolify.example.com)";
  }

  return null;
}

export function validateApiToken(token: string): string | null {
  if (!isNotEmpty(token)) {
    return "API token is required";
  }

  if (token.length < 10) {
    return "API token seems too short";
  }

  return null;
}
