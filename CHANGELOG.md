## v1.4.0

### Features
- New animated UI: floating capsule tab bar with a sliding pill, cross-fading tab transitions, skeleton loading, staggered list entrance, press feedback; all animations run on the UI thread and respect "Reduce Motion"
- Resources header with a live status summary, plus search by name within the active filter
- Deployment status on resource cards: "Deploying" after start/restart/deploy (tap to open the live logs), "Starting" and "Stopping" for databases/services and stops; conflicting actions are disabled until Coolify catches up
- Deploy with optional Force Rebuild, then "Watch live"
- Live deployment view: build log tail refreshed every 3s, cancel from the header; "Show full log" once finished
- Database logs and per-container service logs (Coolify >= 4.2), with optional live tail
- Rollback an application to a previous image (Coolify >= 4.3)
- Server quick actions: restart proxy and Docker cleanup (Coolify >= 4.3)
- "Couldn't refresh · Retry" banner when a refresh fails while older data is shown

### Fixes
- Auto-refresh pauses while a tab is hidden or the app is in the background, and refreshes on return
- Timeout and connection errors are detected correctly with the new fetch implementation; the timeout also covers stalled response bodies
- Clear error for non-JSON responses (e.g. a login page from an auth proxy) and for endpoints missing on older Coolify versions
- Legacy deploy only sends `force` when set (older Coolify read `"false"` as true)
- Stale responses (older polls, previous instance) no longer overwrite newer data
- No "Not configured" flash on cold start; retry on failed first loads (deployment, rollback)
- Status badge pulse no longer restarts on every refresh
- Tapping a disabled button inside a card no longer opens the card
- Accessibility: labels on icon-only buttons, larger touch targets (tab bar 48dp), proper roles for the tab bar, links and action rows

### Misc
- Upgrade to Expo SDK 57: React Native 0.86, React 19.2, Reanimated 4.5, TypeScript 6
- `@react-navigation/*` imports moved to expo-router entry points; `@expo/vector-icons` replaced by `@react-native-vector-icons/material-icons`
- Removed unused dependencies (`react-native-gesture-handler`, `expo-device`, `expo-image`, `expo-symbols`, `expo-web-browser`, `@expo-google-fonts/dm-sans`) and unused code
- Typed routes instead of `Href` casts; uuids are URL-encoded in API paths
- Revised CLAUDE.md and project skills layout

### Notes
- Requires a new native build (EAS): this release cannot be delivered as an OTA update
- iOS builds need Xcode 26.4 and iOS 16.4+ (Expo SDK 57)

## v1.3.0

### Features
- Version-aware API actions: start/stop/restart/deploy/validate now use POST on Coolify >= 4.2.0 and GET on older versions; the server version is auto-detected on connection test, with a manual `< 4.2.0` / `>= 4.2.0` selector as fallback
- Pull latest images for services

## v1.2.0

- Add unified Resources view for applications, databases and services
- Add per-application deployment history
- Add Servers tab with health status and server detail
- Add build logs to deployment details
- Add copy-to-clipboard for UUIDs, repositories and server IPs
- Split multi-domain URLs into separate, tappable links
- Add disclaimer screen in settings
- Fix deployment status label (finished now shows as success)

## v1.1.0

- Implement multiple Coolify instance management in settings
- Add GitHub repository link and version in settings
- Update app icons
- Update background color
- Migrate configuration from `app.json` to `app.config.ts`

## v1.0.0

- Initial release with:
  - Real-time overview of every Coolify application with status, FQDN, and repository metadata.
  - One-tap controls for start, stop, restart, deploy, and log streaming.
  - Deployment history with commit details, runtime status, and quick drill-down.
  - Secure storage for server URL and API token via Expo Secure Store.
