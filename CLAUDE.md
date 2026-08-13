# Coolify Manager App — CLAUDE.md

## Project Overview

Coolify Manager is a React Native app (Expo SDK) to manage Coolify instances from your phone: applications, databases, services, servers, and deployments.

**Stack**: Expo SDK 54 · React Native 0.81 · React 19.1 · TypeScript 5.9 (strict) · expo-router (file-based routing) · EAS Build.

## Architecture

| Folder | Role | Source of truth |
|---|---|---|
| `app/` | expo-router file-based routes | `app/(tabs)/index.tsx` |
| `components/ui/` | UI primitives (Button, Card, Text…) | `components/ui/button.tsx` |
| `components/<feature>/` | Feature components | `components/resources/resource-card.tsx` |
| `hooks/` | Data fetching + reusable logic | `hooks/useResources.ts` |
| `lib/` | API client, storage, events | `lib/coolify-api.ts` |
| `providers/` | React context | `providers/coolify-api-provider.tsx` |
| `theme/` | Colors, spacing, radius, typography | `theme/index.ts` |
| `types/` | Shared types (API, config) | `types/api.ts` |
| `utils/` | Pure functions | `utils/status.ts` |
| `constants/` | Centralized constants | `constants/index.ts` |

## Code Conventions

Follow the source-of-truth files listed above. When in doubt, match the existing code.

- **Components**: one per file; kebab-case filename, PascalCase component name. Use the custom UI kit (`Text`, `Button`, `Card`, …) and the theme system — not raw React Native components. No hardcoded inline styles: use `theme/spacing`, `theme/colors`, `theme/radius`.
- **Hooks**: `useXxx.ts`; data fetching via `useCoolifyApi` from the provider; `useCallback`/`useEffect`/`useState` pattern as in `hooks/useResources.ts`.
- **Constants**: centralized in `constants/index.ts`, never scattered in components.
- **Types**: centralized in `types/`, imported with `import type`.
- **Utils**: pure functions in `utils/`, no side effects.
- **Imports**: path alias `@/*`; `import type` for type-only imports.
- **TypeScript**: strict; no implicit `any`; no unused locals/params.

## Development Workflow

1. Commit directly to `dev` — no feature branches, no PRs.
2. **Always follow the `keep-it-simple` skill** during development: YAGNI, no over-engineering, simplest solution, one component per file, no unnecessary dependencies, 60fps.
3. Commit with Conventional Commits: `feat(scope): message`, `fix: message`, `chore:`, `docs:`, `refactor:`.
4. No tests in this project.

## Release Workflow

To ship `dev` to production, invoke the `release-to-production` skill (`/release-to-production`): version bump (major/minor/bugfix, recommended), CHANGELOG update, release branch, PR `release/x.y.z` → main titled `Release vX.Y.Z` (merged with a real merge commit, not squash), tag, GitHub Release, and a reminder that the EAS build is done manually.

## Quality Gates

- CI runs `yarn typecheck` and `yarn lint` on PRs (`.github/workflows/ci.yml`).
- Direct commits to `dev` do not require checks.
