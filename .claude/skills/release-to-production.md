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
