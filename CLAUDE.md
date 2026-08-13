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

1. Small changes (docs, skills, config) — commit directly to `dev`, no PRs, no checks.
2. Feature work — branch from `dev` (e.g. `feat/...`, `fix/...`); when ready, invoke the `open-pr` skill (`/open-pr`).
3. **Always follow the `keep-it-simple` skill** during development: YAGNI, no over-engineering, simplest solution, one component per file, no unnecessary dependencies, 60fps.
4. Commit with Conventional Commits: `feat(scope): message`, `fix: message`, `chore:`, `docs:`, `refactor:`.
5. No tests in this project.

## PR Workflow

When a feature/fix branch is ready, invoke the `open-pr` skill (`/open-pr`): it runs a self-review via the `pr-reviewer` subagent, fixes high/critical issues, runs typecheck + lint, writes the PR description, and opens the PR toward `dev` (squash and merge).

## Release Workflow

To ship `dev` to production, invoke the `release-to-production` skill (`/release-to-production`): version bump (major/minor/bugfix, recommended), CHANGELOG update, release branch, PR `release/x.y.z` → main titled `Release vX.Y.Z` (merged with a real merge commit, not squash), tag, GitHub Release, and a reminder that the EAS build is done manually.

## Quality Gates

- `yarn typecheck` and `yarn lint` — required for feature PRs (via `/open-pr`).
- CI runs both on every PR (`.github/workflows/ci.yml`).
- Direct commits to `dev` (docs/skills/config) do not require checks.
