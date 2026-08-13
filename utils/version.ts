interface Version {
  major: number;
  minor: number;
  patch: number;
  /** Pre-release suffix (e.g. "beta.1" in "4.2.0-beta.1"). */
  prerelease?: string;
}

// Parse a version string like "v4.2.0" or "4.2.0-beta.1" into numeric parts.
// Returns null when the string is not a recognizable version.
export function parseVersion(version: string): Version | null {
  const match = version
    .replace(/^v/i, "")
    .match(/^(\d+)\.(\d+)(?:\.(\d+))?(?:-([0-9A-Za-z.-]+))?/);

  if (!match) return null;

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: match[3] ? Number(match[3]) : 0,
    prerelease: match[4],
  };
}

// True when `version` is >= `minimum` (e.g. isVersionAtLeast("4.2.0", "4.2.0")).
// Returns null when either string is unparseable, so the caller can decide the
// fallback instead of silently classifying an unknown version.
export function isVersionAtLeast(
  version: string,
  minimum: string,
): boolean | null {
  const v = parseVersion(version);
  const m = parseVersion(minimum);

  if (!v || !m) return null;

  if (v.major !== m.major) return v.major > m.major;
  if (v.minor !== m.minor) return v.minor > m.minor;
  if (v.patch !== m.patch) return v.patch > m.patch;

  // Same numeric parts: a pre-release of the minimum (e.g. 4.2.0-beta.1) is below it.
  if (v.prerelease && !m.prerelease) return false;

  return true;
}
