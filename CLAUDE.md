# Coolify Manager App

React Native app (Expo) to manage Coolify instances from a phone: applications, databases, services, servers and deployments, through the official Coolify REST API.

**Stack**: Expo SDK 57 · React Native 0.86 · React 19.2 (React Compiler on) · TypeScript 6.0 strict · expo-router · Reanimated 4 · EAS Build. Package manager: yarn (v1).

The user writes in Italian: reply in Italian. Code, comments, commits and PR descriptions are in English.

## Commands

```bash
yarn typecheck          # tsc --noEmit
yarn lint               # expo lint (0 errors required; warnings are tolerated)
yarn start              # Metro for the dev client
npx expo-doctor         # dependency/config health check after upgrades
```

There are no automated tests. Verify changes with typecheck, lint, and by running the app.

### Dev build on a physical Android device

`android/` and `ios/` are generated (Continuous Native Generation) and gitignored: never edit them by hand, change `app.config.ts` instead. `APP_VARIANT=development` switches to the dev variant (package `com.ontech7.coolifyManager.dev`, scheme `coolifymanager-dev`), which installs alongside the production app with separate storage.

```bash
APP_VARIANT=development npx expo prebuild -p android --clean --no-install
cd android && APP_VARIANT=development ./gradlew app:assembleDebug -PreactNativeArchitectures=arm64-v8a
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb reverse tcp:8081 tcp:8081
APP_VARIANT=development npx expo start --dev-client
```

A native rebuild is only needed when native dependencies or config plugins change; JS changes hot-reload. `adb` lives in `$ANDROID_HOME/platform-tools` and may not be on `PATH`.

## Architecture

| Folder | Role | Reference file |
|---|---|---|
| `app/` | expo-router routes (`(tabs)/` for the tab bar, modals at root) | `app/(tabs)/index.tsx` |
| `components/ui/` | UI kit (`Text`, `Button`, `Card`, `IconButton`, `StatusBadge`…) | `components/ui/button.tsx` |
| `components/<feature>/` | Feature components | `components/resources/resource-card.tsx` |
| `hooks/` | Data fetching and reusable logic | `hooks/useResources.ts` |
| `lib/` | API client, secure storage, haptics, config events | `lib/coolify-api.ts` |
| `providers/` | React context (the API client) | `providers/coolify-api-provider.tsx` |
| `theme/` | `colors`, `spacing`, `radius`, `motion` | `theme/index.ts` |
| `types/` | Shared types | `types/api.ts` |
| `utils/` | Pure functions (status parsing, dates, versions) | `utils/status.ts` |
| `constants/` | App-wide constants | `constants/index.ts` |

When unsure how to write something, open the reference file for that folder and match it.

## Conventions

- **Components**: one per file, kebab-case filename, PascalCase name. Build UI from `components/ui/` (e.g. its `Text` instead of React Native's); `View`, `ScrollView` and `Pressable` from React Native are fine. Styles go in `StyleSheet.create` using theme tokens for colors, spacing, radius and motion; there is no typography scale, so font sizes are literal.
- **Hooks**: `useXxx.ts`, get the client with `useCoolifyApi()`, follow the `useState` + `useCallback` + `useEffect` shape of `hooks/useResources.ts`. Polling goes through `useAutoRefresh`, which pauses when the screen is unfocused or the app is backgrounded.
- **Constants, types, utils**: constants in `constants/index.ts`; shared types in `types/`, imported with `import type`; `utils/` stays pure.
- **Imports**: use the `@/` alias.
- **Commits**: Conventional Commits (`feat(scope):`, `fix:`, `chore:`, `docs:`, `refactor:`).

## Gotchas

- **Navigation imports**: import from `expo-router` (or `expo-router/js-tabs` for bottom-tab types and `useBottomTabBarHeight`). Since SDK 56, `@react-navigation/*` packages are not dependencies and must not be imported directly.
- **Reanimated**: write shared values with `.set(...)`, not `.value =`. React Compiler is enabled and the `react-hooks/immutability` lint rule rejects mutation. Reading `.value` inside worklets (`useAnimatedStyle`) is fine.
- **Icons**: `import { MaterialIcons, type MaterialIconsIconName } from "@react-native-vector-icons/material-icons"`. `@expo/vector-icons` is deprecated and removed.
- **fetch**: native `fetch` is `expo/fetch`. Aborts and network failures reject with a generic `FetchError` whose message starts with `fetch failed`, not with `AbortError`. Check `controller.signal.aborted` to detect timeouts (see `request` in `lib/coolify-api.ts`).
- **Coolify API versions**: servers older than 4.2.0 use GET for actions and newer ones POST (`apiMode` in `lib/coolify-api.ts`). Endpoints added in recent releases go through `requestSince`, which turns a generic 404 into an actionable message. Cleartext HTTP is allowed because many instances run on a LAN IP.
- **`react-hooks/set-state-in-effect`** is a warning on purpose: data hooks start their fetch from an effect. Don't add new warnings elsewhere.

## Principles

Keep it simple (see the `keep-it-simple` skill): the smallest change that solves the problem, no speculative abstractions or config, no new dependency when React Native, the Expo SDK or the UI kit already covers it. The app should hold 60fps: lists use FlashList, animations run on the UI thread with Reanimated, and avoid needless re-renders.

## Workflow

- **Small changes** (docs, skills, config): commit directly to `dev`.
- **Features and fixes**: branch from `dev` (`feat/...`, `fix/...`, `chore/...`). When ready, run the `open-pr` skill. It self-reviews with the `pr-reviewer` agent, runs typecheck and lint, and opens a squash-merge PR to `dev`. CI (`.github/workflows/ci.yml`) runs typecheck and lint on every PR.
- **Releases**: the `release-to-production` skill ships `dev` to `main` (release PR merged with a merge commit, not squash). `store-changelog` writes the store "What's New" text. EAS builds are started manually by the user.
- Commit, push, open PRs or merge only when the user asks or when a skill they invoked says so.
