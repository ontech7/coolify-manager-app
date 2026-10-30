---
name: release-to-production
description: Release dev to production. Version bump (major/minor/bugfix, recommended), CHANGELOG update, release branch, PR release/x.y.z → main titled "Release vX.Y.Z", tag, GitHub Release, dev realigned to main, EAS build reminder. Use when dev is ready to ship, or when the user says "release", "facciamo una release", "release to production", or similar.
---

# Release to Production

Playbook for shipping `dev` to production.

`main` must always be an ancestor of `dev`: every release starts from `dev` and ends with `dev` fast-forwarded to `main`. If they diverge (e.g. a release PR was squash-merged), the next release PR conflicts with `main`.

## Steps

0. **Pre-check** — `git fetch origin`, then `git merge-base --is-ancestor origin/main origin/dev`.
   - If `main` is not an ancestor of `dev`, check what `main` has that `dev` lacks (`git log origin/dev..origin/main`, `git diff origin/main origin/dev`). If `dev` already contains those changes (typical after a squash-merged release), merge `main` into the release branch with `git merge -s ours origin/main` after step 3, explaining why in the commit message. Otherwise stop and ask the user.

1. **Version bump**
   - Ask the user whether the bump is major, minor, or bugfix, **recommending** one based on the changes in `dev`:
     - Breaking changes → major
     - New features → minor
     - Fixes only → bugfix
   - Update `version` in `package.json` **and** `app.config.ts` (both, kept in sync), and the version badge in `README.md`.

2. **Changelog**
   - Add a `## vX.Y.Z` section at the top of `CHANGELOG.md`:
     - Technical list of changes grouped: **Features**, **Fixes**, **Misc**.
     - Any **Notes** if needed.

3. **Release branch**
   - Create `release/x.y.z` from `dev`. The version-bump and changelog commits (steps 1–2) are included in this branch.

4. **PR `release/x.y.z` → main**
   - Title: `Release vX.Y.Z`.
   - Body in English:
     - **Summary**: business-like, no technical jargon — what the user gains.
     - **Changelog**: technical — Features / Fixes / Misc.
     - **Notes**: if needed.

5. **Merge** — merge the PR with a **real merge commit** (`gh pr merge --merge`) when checks pass. Do **NOT** squash: the release PR must preserve the full commit history on `main` (a squash produces a single "Release vX.Y.Z" commit with an unreadable body).

6. **Tag** — create tag `vX.Y.Z` on the merge commit.

7. **GitHub Release** — create the release on GitHub (`gh release create vX.Y.Z`):
   - Body: a **business-like summary** first (no technical jargon — what the user gains), then the technical changelog (Features / Fixes / Misc).
   - Attach the APK asset if available (EAS build output).

8. **Realign `dev`** — fast-forward `dev` to `main`, so `dev` gets the release merge commit (version bump and changelog included):
   - `git checkout dev && git pull --ff-only origin dev && git merge --ff-only origin/main && git push origin dev`
   - Verify `git rev-parse origin/dev origin/main` prints the same commit. If the fast-forward fails, someone pushed to `dev` during the release: merge `origin/main` into `dev` with a normal merge commit instead.

9. **EAS Build** — remind the user: the EAS build is done manually (not by this skill).
