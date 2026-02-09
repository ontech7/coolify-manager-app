import { ConfigContext, ExpoConfig } from "expo/config";

const IS_DEV = process.env.APP_VARIANT === "development";

const config = ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_DEV ? "Coolify Manager (Dev)" : "Coolify Manager",
  slug: "coolifyManager",
  version: "1.1.0",
  githubUrl: "https://github.com/ontech7/coolify-manager-app",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: IS_DEV ? "coolifymanager-dev" : "coolifymanager",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: IS_DEV
      ? "com.ontech7.coolifyManager.dev"
      : "com.ontech7.coolifyManager",
  },
  android: {
    adaptiveIcon: {
      backgroundImage: "./assets/images/adaptive-icon-bg.png",
      foregroundImage: "./assets/images/adaptive-icon.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: IS_DEV
      ? "com.ontech7.coolifyManager.dev"
      : "com.ontech7.coolifyManager",
  },
  web: {
    output: "static" as const,
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-build-properties",
      {
        android: {
          usesCleartextTraffic: true,
        },
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/adaptive-icon.png",
        imageWidth: 240,
        backgroundColor: "#16213E",
      },
    ],
    [
      "expo-dev-client",
      {
        launchMode: "most-recent",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: "832c4fd0-161f-487c-a726-6ab72ba0b768",
    },
  },
});

export default config;
