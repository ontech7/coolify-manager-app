# Project Skills, CLAUDE.md and CI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a project CLAUDE.md, three project skills (keep-it-simple, open-pr, release-to-production), a pr-reviewer subagent, a lightweight CI workflow (typecheck + lint), and branch protection on `dev` and `main`.

**Architecture:** All deliverables are markdown/config files plus one GitHub-side configuration. The CLAUDE.md is the source of truth the model reads every session; the skills are invocable playbooks; the pr-reviewer agent is dispatched by the open-pr skill; the CI workflow enforces the quality gates; branch protection makes the CI checks required.

**Tech Stack:** Expo SDK 54, TypeScript 5.9 (strict), yarn (classic), GitHub Actions, `gh` CLI.

## Global Constraints

- All deliverables written in **English** (conversations stay in Italian).
- Conventional Commits for every commit: `feat(scope):`, `fix:`, `chore:`, `docs:`, `ci:`, `refactor:`.
- No build step in CI (would clog GitHub Actions).
- CI checks are exactly two: `typecheck` (`tsc --noEmit`) and `lint` (`expo lint`).
- Branch protection: required status checks (`typecheck`, `lint`), no force pushes, no branch deletions, no mandatory PR review, `enforce_admins: false`.
- EAS builds are manual (user), never automated by skills or CI.
- Path alias `@/*` → project root; TypeScript strict.

---

### Task 1: Add typecheck script and CI workflow

**Files:**
- Modify: `package.json` (add `typecheck` script to `scripts`)
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Produces: `yarn typecheck` script (used by CI and by the open-pr skill); CI job names `typecheck` and `lint` (used as required status check contexts in Task 7).

- [ ] **Step 1: Add the typecheck script to package.json**

In `package.json`, inside `"scripts"`, add the `typecheck` entry (alphabetical order, after `"start"`):

```json
    "typecheck": "tsc --noEmit",
```

- [ ] **Step 2: Create the CI workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [dev, main]

jobs:
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: yarn
      - run: yarn install --frozen-lockfile
      - run: yarn typecheck

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: yarn
      - run: yarn install --frozen-lockfile
      - run: yarn lint
```

Note: job ids are `typecheck` and `lint` (no `name:` override) so the required status check contexts in Task 7 are exactly `typecheck` and `lint`.

- [ ] **Step 3: Verify both gates pass locally**

Run: `yarn typecheck`
Expected: exits 0, no output (or no type errors).

Run: `yarn lint`
Expected: exits 0, no lint errors.

- [ ] **Step 4: Commit**

```bash
git add package.json .github/workflows/ci.yml
git commit -m "ci: add typecheck and lint workflow

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: Create CLAUDE.md

**Files:**
- Create: `CLAUDE.md`

**Interfaces:**
- Produces: the project source of truth. References skill names `keep-it-simple`, `open-pr`, `release-to-production` (created in Tasks 3–6) and the `pr-reviewer` agent (Task 4). Later tasks must keep their skill/agent names consistent with this file.

- [ ] **Step 1: Create CLAUDE.md**

Create `CLAUDE.md` at the project root:

````markdown
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

1. Branch from `dev` (e.g. `feat/...`, `fix/...`).
2. **Always follow the `keep-it-simple` skill** during development: YAGNI, no over-engineering, simplest solution, one component per file, no unnecessary dependencies, 60fps.
3. Commit with Conventional Commits: `feat(scope): message`, `fix: message`, `chore:`, `docs:`, `refactor:`.
4. No tests in this project — quality is ensured by the self-review subagent at PR time.
5. End-of-work gates: `yarn typecheck` and `yarn lint` must pass clean.

## PR Workflow

When a feature/fix branch is ready, invoke the `open-pr` skill (`/open-pr`): it runs a self-review via the `pr-reviewer` subagent, fixes high/critical issues, runs typecheck + lint, writes the PR description, and opens the PR toward `dev` (squash and merge).

## Release Workflow

To ship `dev` to production, invoke the `release-to-production` skill (`/release-to-production`): version bump (major/minor/bugfix, recommended), CHANGELOG update, release branch, PR `dev → main` titled `Release vX.Y.Z`, tag, and a reminder that the EAS build is done manually.

## Quality Gates

- `yarn typecheck` — must pass.
- `yarn lint` — must pass.
- CI runs both on every PR (`.github/workflows/ci.yml`); branch protection on `dev` and `main` requires them.
````

- [ ] **Step 2: Verify**

Read `CLAUDE.md` back. Confirm: all skill/agent names match the ones created in Tasks 3–6 (`keep-it-simple`, `open-pr`, `release-to-production`, `pr-reviewer`); the architecture table matches the actual repo folders.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add project CLAUDE.md

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: Create keep-it-simple skill

**Files:**
- Create: `.claude/skills/keep-it-simple.md`

**Interfaces:**
- Produces: skill named `keep-it-simple`, invocable as `/keep-it-simple` and via trigger keywords ("keep it simple", "mantienilo semplice", "semplice", "semplifica", "no over-engineering", "YAGNI"). Referenced by CLAUDE.md (Task 2) as always-active during development.

- [ ] **Step 1: Create the skill file**

Create `.claude/skills/keep-it-simple.md`:

````markdown
---
name: keep-it-simple
description: Keep code simple — YAGNI, no over-engineering. Use when developing features or fixes, or when the user says "keep it simple", "mantienilo semplice", "semplice", "semplifica", "no over-engineering", "YAGNI", or similar. Always active during development (see CLAUDE.md).
---

# Keep It Simple

Follow these principles during any development work. The goal: the simplest solution that works, maintainable and fast.

## Principles

1. **YAGNI** — implement only what's needed now. No preventive abstractions, no future-use config, no "might need it later".
2. **No over-engineering** — the simplest working solution. A 10-line function doesn't need a service layer or a class.
3. **Right files** — new components/functions/constants go in the existing appropriate files (see CLAUDE.md → Code Conventions). Create a new file only if strictly necessary.
4. **One component per file** — at most a few tiny (few-line) components in the same file; never many large components in one file.
5. **Dependencies** — install a new library only if truly necessary. First check what's already available: React Native core, Expo SDK, the custom UI kit. Every library bloats the build.
6. **Optimization** — always optimize: no unnecessary re-renders, no repeated computations, `useCallback`/`useMemo` where they help.
7. **UI/UX** — the best possible while keeping simplicity. Watch padding/margins (they often get lost). Use the theme system.
8. **Performance** — 60fps target: no heavy work on the main thread, lists with FlashList, images with expo-image.

## Checklist (before considering work done)

- [ ] Is this the simplest solution that works?
- [ ] Did I duplicate existing code instead of reusing it?
- [ ] Did I create files that weren't strictly necessary?
- [ ] Did I add libraries that weren't necessary?
- [ ] Are the types correct (strict, no `any`)?
- [ ] Does it follow the source-of-truth conventions (CLAUDE.md)?
- [ ] Is the UI consistent (theme, spacing, padding/margins)?
- [ ] Will it run at 60fps?
````

- [ ] **Step 2: Verify**

Read the file back. Confirm: frontmatter has `name: keep-it-simple` and a description with the trigger keywords; content covers all 8 principles + checklist from the spec.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/keep-it-simple.md
git commit -m "chore: add keep-it-simple skill

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: Create pr-reviewer agent

**Files:**
- Create: `.claude/agents/pr-reviewer.md`

**Interfaces:**
- Produces: agent named `pr-reviewer`, dispatched by the open-pr skill (Task 5). Read-only: reports findings, never modifies files.

- [ ] **Step 1: Create the agent file**

Create `.claude/agents/pr-reviewer.md`:

````markdown
---
name: pr-reviewer
description: Self-review subagent for PRs. Reviews the branch diff for high/critical bugs, missing edge cases, project convention violations, security issues, and performance problems. Dispatched by the open-pr skill.
tools: Read, Grep, Glob, Bash
---

# PR Reviewer

You are a senior software architect reviewing a feature/fix branch before its PR is opened.

## Scope

Review the diff between the current branch and its fork point from `dev` (the base branch). Focus on:

1. **High/critical bugs** — logic errors, crashes, wrong data, race conditions.
2. **Missing edge cases** — empty states, error handling, loading states, null/undefined handling.
3. **Project conventions** — read `CLAUDE.md` → Code Conventions and the source-of-truth files; check naming, file placement, UI kit usage, theme usage, import style.
4. **Security** — no hardcoded tokens/secrets, no credentials in logs.
5. **Performance** — unnecessary re-renders, heavy work on the main thread, lists not using FlashList, images not using expo-image.

## Output

Return findings ordered by severity (critical → high → medium → low). For each finding include:

- **Severity**: critical | high | medium | low
- **File**: path and line
- **Issue**: what's wrong
- **Failure scenario**: concrete input/state → wrong behavior
- **Suggested fix**: brief

Only critical and high findings block the PR. Medium/low are reported but non-blocking.

## Rules

- Verify claims against the actual code — don't guess.
- If a finding is debatable, mark it as such.
- Do not modify any files. Report only.
````

- [ ] **Step 2: Verify**

Read the file back. Confirm: frontmatter has `name: pr-reviewer`, a description, and read-only `tools`; body covers the 5 focus areas, severity-ordered output format, and the "report only" rule.

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/pr-reviewer.md
git commit -m "chore: add pr-reviewer subagent

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: Create open-pr skill

**Files:**
- Create: `.claude/skills/open-pr.md`

**Interfaces:**
- Consumes: `pr-reviewer` agent (Task 4); `yarn typecheck` script (Task 1).
- Produces: skill named `open-pr`, invocable as `/open-pr` and via trigger keywords ("open pr", "apri la pr", "pronta la pr", "self-review"). Referenced by CLAUDE.md (Task 2).

- [ ] **Step 1: Create the skill file**

Create `.claude/skills/open-pr.md`:

````markdown
---
name: open-pr
description: Open a PR for a feature/fix branch. Runs a self-review via the pr-reviewer subagent, fixes high/critical issues, runs typecheck + lint, writes the PR description, and opens the PR toward dev (squash and merge). Use when a feature/fix branch is ready, or when the user says "open pr", "apri la pr", "pronta la pr", "self-review", or similar.
---

# Open PR

Playbook for opening a feature/fix PR toward `dev`.

## Steps

1. **Pre-checks**
   - Current branch is not `dev` or `main`.
   - Branch is up to date with `dev` (rebase if needed).
   - Commit messages follow Conventional Commits (`feat(scope):`, `fix:`, `chore:`, `docs:`, `refactor:`).

2. **Self-review**
   - Dispatch the `pr-reviewer` subagent on the branch diff (base: fork point from `dev`).
   - Fix all critical and high findings.
   - Fix convention violations.
   - Fill gaps (edge cases, empty states, error handling).
   - If a finding is debatable, ask the user before implementing.

3. **Quality gates**
   - Run `yarn typecheck` — must pass.
   - Run `yarn lint` — must pass.

4. **PR description** (in English)
   - Summary of changes.
   - What was tested.
   - Any notes.

5. **Open the PR**
   - `gh pr create --base dev --head <branch> --title "<conventional title>" --body "<description>"`
   - Merge mode: Squash and merge (checks must pass before merge).
````

- [ ] **Step 2: Verify**

Read the file back. Confirm: frontmatter has `name: open-pr` and trigger keywords; the 5 steps match the spec (pre-checks → self-review → quality gates → description → open).

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/open-pr.md
git commit -m "chore: add open-pr skill

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 6: Create release-to-production skill

**Files:**
- Create: `.claude/skills/release-to-production.md`

**Interfaces:**
- Produces: skill named `release-to-production`, invocable as `/release-to-production` and via trigger keywords ("release", "facciamo una release", "release to production"). Referenced by CLAUDE.md (Task 2).

- [ ] **Step 1: Create the skill file**

Create `.claude/skills/release-to-production.md`:

````markdown
---
name: release-to-production
description: Release dev to production. Version bump (major/minor/bugfix, recommended), CHANGELOG update, release branch, PR dev → main titled "Release vX.Y.Z", tag, EAS build reminder. Use when dev is ready to ship, or when the user says "release", "facciamo una release", "release to production", or similar.
---

# Release to Production

Playbook for shipping `dev` to production.

## Steps

1. **Version bump**
   - Ask the user whether the bump is major, minor, or bugfix, **recommending** one based on the changes in `dev`:
     - Breaking changes → major
     - New features → minor
     - Fixes only → bugfix
   - Update `version` in `package.json` **and** `app.config.ts` (both, kept in sync).

2. **Changelog**
   - Add a `## vX.Y.Z` section at the top of `CHANGELOG.md`:
     - Technical list of changes grouped: **Features**, **Fixes**, **Misc**.
     - Any **Notes** if needed.

3. **Release branch**
   - Create `release/x.y.z` from `dev`.

4. **PR dev → main**
   - Title: `Release vX.Y.Z`.
   - Body in English:
     - **Summary**: business-like, no technical jargon — what the user gains.
     - **Changelog**: technical — Features / Fixes / Misc.
     - **Notes**: if needed.

5. **Merge** — merge the PR when checks pass.

6. **Tag** — create tag `vX.Y.Z` on the merge commit.

7. **EAS Build** — remind the user: the EAS build is done manually (not by this skill).
````

- [ ] **Step 2: Verify**

Read the file back. Confirm: frontmatter has `name: release-to-production` and trigger keywords; the 7 steps match the spec (version bump with recommendation → changelog → release branch → PR → merge → tag → EAS reminder).

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/release-to-production.md
git commit -m "chore: add release-to-production skill

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 7: Configure branch protection on dev and main

**Files:**
- None (GitHub-side configuration via `gh`).

**Interfaces:**
- Consumes: CI job names `typecheck` and `lint` (Task 1) as required status check contexts.

- [ ] **Step 1: Verify gh auth and repo access**

Run: `gh auth status`
Expected: authenticated, and the user has admin access to `ontech7/coolify-manager-app`. If not admin, stop and ask the user to grant access or run the commands themselves.

- [ ] **Step 2: Apply protection to `dev`**

Run:

```bash
gh api -X PUT repos/ontech7/coolify-manager-app/branches/dev/protection \
  -H "Accept: application/vnd.github+json" \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["typecheck", "lint"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

Expected: HTTP 200 with the protection object in the response.

- [ ] **Step 3: Apply protection to `main`**

Run the same command as Step 2 with `branches/main/protection`.

Expected: HTTP 200 with the protection object in the response.

- [ ] **Step 4: Verify both branches**

Run:

```bash
gh api repos/ontech7/coolify-manager-app/branches/dev/protection --jq '{required_status_checks, allow_force_pushes, allow_deletions}'
gh api repos/ontech7/coolify-manager-app/branches/main/protection --jq '{required_status_checks, allow_force_pushes, allow_deletions}'
```

Expected: both show `required_status_checks.contexts == ["typecheck", "lint"]`, `allow_force_pushes == false`, `allow_deletions == false`.

- [ ] **Step 5: Report**

No commit (GitHub-side change). Report to the user: protection applied to `dev` and `main`; note that the CI checks will appear once the workflow runs on a PR (the workflow is already on `dev`; it reaches `main` with the next release).

---

## Self-Review

**Spec coverage:**
- CLAUDE.md (spec §1) → Task 2 ✓
- keep-it-simple skill (spec §2) → Task 3 ✓
- open-pr skill (spec §3) → Task 5 ✓
- pr-reviewer agent (spec §3) → Task 4 ✓
- release-to-production skill (spec §4) → Task 6 ✓
- CI workflow, typecheck + lint only, no build (spec §5) → Task 1 ✓
- `typecheck` script added to package.json (spec §5) → Task 1 ✓
- Branch protection via gh, CI checks only, no force push, no deletions, no mandatory review (spec §6) → Task 7 ✓

**Placeholder scan:** No TBD/TODO; every file's full content is inlined in its task. ✓

**Type consistency:** Skill/agent names are consistent across CLAUDE.md (Task 2) and the skill/agent files (Tasks 3–6): `keep-it-simple`, `open-pr`, `release-to-production`, `pr-reviewer`. CI job ids `typecheck`/`lint` (Task 1) match the required status check contexts (Task 7). ✓
