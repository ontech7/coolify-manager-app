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
