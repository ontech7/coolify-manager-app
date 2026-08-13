# Project Skills, CLAUDE.md and CI — Design

**Date**: 2026-08-13
**Status**: Approved by user (Andrea Losavio)

## Goal

Equip the Coolify Manager App repo with:

1. A `CLAUDE.md` that captures the project's stack, architecture, code conventions and development workflow (the "source of truth" the model reads every session).
2. A `keep-it-simple` skill enforcing YAGNI / no over-engineering during development.
3. An `open-pr` skill that runs a self-review via a dedicated subagent, then writes and opens the PR.
4. A `release-to-production` skill for the dev → main release flow.
5. A lightweight GitHub Actions CI (typecheck + lint only, no build) so PRs must pass checks before merge.
6. Branch protection on `main` and `dev` configured via `gh`.

All deliverables are written in **English** (conversations stay in Italian).

## File Structure

```
coolify-manager-app/
├── CLAUDE.md                          # Project map (source of truth)
├── .github/
│   └── workflows/
│       └── ci.yml                     # Typecheck + lint on pull_request
└── .claude/
    ├── skills/
    │   ├── keep-it-simple.md          # Simplicity principles for development
    │   ├── open-pr.md                 # Feature/fix PR playbook → dev
    │   └── release-to-production.md   # Release playbook dev → main
    └── agents/
        └── pr-reviewer.md             # Subagent for self-review
```

## 1. CLAUDE.md

Sections:

1. **Project overview** — what the app does, stack (Expo SDK 54, RN 0.81, React 19, TypeScript strict, expo-router).
2. **Architecture map** — role of each folder, with source-of-truth files:

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

3. **Code conventions** — how to write each artifact, derived from the source-of-truth files:
   - **Components**: one per file, kebab-case filename + PascalCase name; use the custom UI kit (`Text`, `Button`, `Card`) and the theme system, not raw RN components; no hardcoded inline styles — use `theme/spacing`, `theme/colors`, `theme/radius`.
   - **Hooks**: `useXxx.ts`, data fetching via `useCoolifyApi`, `useCallback`/`useEffect`/`useState` pattern as in `useResources.ts`.
   - **Constants**: centralized in `constants/index.ts`, never scattered in components.
   - **Types**: centralized in `types/`, imported with `import type`.
   - **Utils**: pure functions in `utils/`, no side effects.
   - **Imports**: path alias `@/*`, `import type` for types.
   - **TypeScript**: strict, no implicit `any`, no unused locals/params.
4. **Development workflow** — branch from `dev`; keep-it-simple always active; typecheck + lint as end-of-work gates; no tests (rely on self-review).
5. **PR workflow** — invoke `/open-pr` (self-review subagent → fix → typecheck/lint → description → open PR toward `dev`, squash and merge).
6. **Release workflow** — invoke `/release-to-production` (version bump → changelog → summary → PR toward `main`).
7. **Quality gates** — `yarn typecheck` and `yarn lint` mandatory; no merge with errors.

## 2. keep-it-simple skill

- **Frontmatter**: `name: keep-it-simple`; description includes trigger keywords in English and Italian ("keep it simple", "mantienilo semplice", "semplice", etc.) so it activates both on user invocation and as a standing instruction from CLAUDE.md.
- **Content** — principles + operational checklist:
  1. **YAGNI** — implement only what's needed now. No preventive abstractions, no future-use config, no "might need it".
  2. **No over-engineering** — the simplest working solution. A 10-line function doesn't need a service layer.
  3. **Right files** — new components/functions/constants go in the existing appropriate files (see CLAUDE.md → Code conventions). Create a new file only if strictly necessary.
  4. **One component per file** — at most a few tiny components in the same file; never many large components in one file.
  5. **Dependencies** — install new libraries only if truly necessary; first check what's already available (RN core, Expo SDK, custom UI kit). Every library bloats the build.
  6. **Optimization** — always optimize: no unnecessary re-renders, no repeated computations, `useCallback`/`useMemo` where needed.
  7. **UI/UX** — best possible while keeping simplicity; watch padding/margins (often lost); use the theme system.
  8. **Performance** — 60fps target: no heavy work on the main thread, lists with FlashList, images with expo-image.
  9. **Final checklist** — is this the simplest solution? Did I duplicate existing code? Did I create unnecessary files? Did I add unneeded libraries? Are types correct?

## 3. open-pr skill + pr-reviewer subagent

**open-pr skill** — step-by-step playbook:

1. **Pre-checks**: branch up to date with `dev` (rebase if needed); commits follow conventional format (`feat(scope):`, `fix:`, `chore:`, `docs:`).
2. **Self-review**: dispatch the `pr-reviewer` subagent on the branch diff (base: fork point from `dev`).
3. **Fix**: high/critical bugs must be fixed; convention violations fixed; gaps (edge cases, empty states, error handling) filled. If a finding is debatable, ask the user before implementing.
4. **Quality gates**: `yarn typecheck` and `yarn lint` must pass clean.
5. **PR description**: summary of changes, what was tested, any notes. In English.
6. **Open**: `gh pr create` with base `dev`; merge mode "Squash and merge" (checks must pass before merge).

**pr-reviewer subagent** (`.claude/agents/pr-reviewer.md`):

- **Focus**: high/critical bugs, missing edge cases, error handling, project conventions (naming, structure, UI kit, theme), security (no hardcoded tokens/secrets), performance (re-renders, lists).
- **Output**: findings ordered by severity (critical → high → medium → low), with file:line and failure scenario. Only critical/high block the PR; medium/low are reported but non-blocking.
- **References**: reads the source-of-truth files (CLAUDE.md → Code conventions) to verify conventions.

## 4. release-to-production skill

**Frontmatter**: `name: release-to-production`, invocable as `/release-to-production`.

**Playbook**:

1. **Version bump** — ask the user whether major, minor or bugfix, **recommending** which based on the changes in `dev` (breaking changes → major, new features → minor, fixes → bugfix). Update `version` in `package.json` **and** `app.config.ts` (both, they are kept in sync).
2. **Changelog** — update `CHANGELOG.md` with a new `## vX.Y.Z` section: technical list of changes grouped (Features, Fixes, Misc) + any notes.
3. **Release branch** — create `release/x.y.z` from `dev`.
4. **PR dev → main** — title `Release vX.Y.Z`. Body in English with:
   - **Summary**: business-like, no technical jargon — what the user gains.
   - **Changelog**: technical — Features / Fixes / Misc.
   - **Notes**: if needed.
5. **Merge** — merge the PR when checks pass.
6. **Tag** — create tag `vX.Y.Z` on the merge.
7. **EAS Build** — **not** done by the skill: done manually by the user (per workflow). The skill reminds this at the end.

## 5. GitHub Actions CI

**File**: `.github/workflows/ci.yml` — trigger on `pull_request` (both `dev` and `main`).

**Checks** (both fast, no build):
1. **Typecheck** — `tsc --noEmit`. Requires adding `"typecheck": "tsc --noEmit"` to `package.json` scripts (currently missing).
2. **Lint** — `expo lint` (eslint already configured).

**Structure**: two parallel jobs (`typecheck` and `lint`) — distinct check names make the required status checks in branch protection unambiguous. Node setup with yarn cache. Estimated time: 1–2 minutes.

**Explicitly excluded**: any build step (would clog GitHub Actions and take too long).

## 6. Branch protection via gh

Configure branch protection on `main` and `dev` using `gh api` (user confirmed: CI checks only):

- Require status checks to pass before merging (the CI checks: typecheck + lint).
- No force pushes.
- No branch deletions.
- No mandatory PR review (solo dev; the self-review subagent covers quality).

Requires admin permissions on the repo (user to confirm at implementation time).

## Out of Scope

- EAS builds (manual, by the user).
- Tests (project has none; self-review subagent is the safety net).
- The existing `pr-description` skill (user-level) is not modified; the new `open-pr` skill is self-contained.
