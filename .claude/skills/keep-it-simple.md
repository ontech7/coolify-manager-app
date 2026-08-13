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
