<p align="center">
  <img src="assets/images/icon.png" alt="Coolify Manager Logo" width="96" height="96">
</p>

<h1 align="center">Coolify Manager App</h1>

<p align="center">
A React Native (Expo SDK) app to manage your <a href="https://coolify.io/">Coolify</a> server directly from your phone.
</p>

<p align="center">
   <img src="https://img.shields.io/badge/Expo-54.0-000020?logo=expo&logoColor=white" alt="Expo">
   <img src="https://img.shields.io/badge/v-1.0.0-blue" alt="App Version">
   <img src="https://img.shields.io/badge/License-MIT-61dafb" alt="License">
</p>

<p align="center">
  <img src="..." alt="Coolify Manager Screenshot" width="600">
</p>

## Highlights

- Real-time overview of every Coolify application with status, FQDN, and repository metadata.
- One-tap controls for start, stop, restart, deploy, and log streaming.
- Deployment history with commit details, runtime status, and quick drill-down.
- Secure storage for server URL and API token via Expo Secure Store.

## Quick Start

```bash
git clone https://github.com/ontech7/coolify-manager-app.git
cd coolify-manager-app
yarn install
yarn start
```

Press `a` in the terminal to open the Android emulator or scan the QR code with Expo Go.

N.B.: if you want to build the **DevClient**, you should first run:

```bash
yarn android
```

## Configure Your Server

1. Enable API Access in Coolify (Settings → Advanced → API Access).
2. Create an API token with `read`, `write`, and `deploy` permissions.
3. In the app, open Settings, enter the server URL (https://coolify.example.com), paste the token, test the connection, and save.

## Tech Stack

- **Expo SDK** 54
- **React** 19.1
- **React Native** 0.81
- **TypeScript** 5.9

## License & Credits

MIT License. See [LICENSE](LICENSE).

Built by Andrea Losavio • [LinkedIn](https://www.linkedin.com/in/andrea-losavio/) – [Website](https://andrealosavio.com)

## Acknowledgments

- [Coolify](https://coolify.io/) - The amazing self-hostable Heroku/Netlify alternative

---

Made with ❤️ for the Coolify community
