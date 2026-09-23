---
name: store-changelog
description: Use when preparing a Play Store or App Store release and you need a copy-paste-ready "What's New" text, or when the user says "changelog", "store changelog", "what's new", "release notes". Generates a business-like changelog (≤500 chars) from the latest CHANGELOG.md section, in the selected language(s).
---

# Store Changelog

Generate a business-like, copy-paste-ready store changelog from the latest `CHANGELOG.md` section.

## When to Use

- Preparing a Play Store / App Store release
- User asks for a "changelog", "what's new", or "release notes" for the stores
- After a release, before the EAS build

## Steps

1. **Read the source** — read the top `## vX.Y.Z` section of `CHANGELOG.md`. If the user passes `--version <x.y.z>`, use that section instead.
2. **Rewrite business-like** — convert the technical bullets into user-facing language:
   - No technical jargon, no internal names (e.g. "version-aware API actions" → "works with the latest Coolify versions")
   - Focus on what the user gains, not how it was implemented
   - Keep each item short and concrete
3. **Trim to ≤500 characters** — the Play Store limit (the strictest; fits both stores):
   - If over 500 chars: shorten wording first, then drop the least user-valuable items
   - The result must read naturally — never a truncated sentence or a bare list of keywords
4. **Output** — ready-to-paste text with the character count:

   ```
   ## Store changelog (English) — 342/500 chars

   <text>
   ```

## Languages

Generate the changelog in the selected language(s). Pass `--lang <code>` (default `eng`).

Available languages:
- `eng` — English

To add a language, add a section here with the translation guidance.

## Rules

- **≤500 characters** — hard limit. Count the final text and show the count.
- **Business-like** — no technical jargon, no internal names, no dependency/version numbers.
- **Plain text** — no markdown formatting; simple lines or short bullets are fine.
- **No promotional language** — Google Play policy: release notes shouldn't solicit actions or be promotional.
