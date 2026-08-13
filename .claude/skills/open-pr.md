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
