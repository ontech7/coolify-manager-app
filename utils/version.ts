interface Version {
  major: number;
  minor: number;
  patch: number;
}

// Parse a version string like "v4.2.0" or "4.2.0-beta.1" into numeric parts.
// Returns null when the string is not a recognizable version.
export function parseVersion(version: string): Version | null {
  const match = version.replace(/^v/i, "").match(/^(\d+)\.(\d+)\.(\d+)/);

  if (!match) return null;

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

// True when `version` is >= `minimum` (e.g. isVersionAtLeast("4.2.0", "4.2.0")).
// Unparseable versions are treated as below the minimum.
export function isVersionAtLeast(version: string, minimum: string): boolean {
  const v = parseVersion(version);
  const m = parseVersion(minimum);

  if (!v || !m) return false;

  if (v.major !== m.major) return v.major > m.major;
  if (v.minor !== m.minor) return v.minor > m.minor;
  return v.patch >= m.patch;
}
