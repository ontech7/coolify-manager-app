export const colors = {
  background: {
    primary: "#1a1a2e",
    secondary: "#16213e",
    gradient: ["#1a1a2e", "#16213e"] as const,
  },
  primary: {
    default: "#6366f1",
    hover: "#4f46e5",
    light: "#a5b4fc",
    background: "rgba(99, 102, 241, 0.2)",
  },
  surface: {
    default: "rgba(255, 255, 255, 0.05)",
    hover: "rgba(255, 255, 255, 0.1)",
    border: "rgba(255, 255, 255, 0.1)",
    borderHover: "rgba(255, 255, 255, 0.2)",
  },
  status: {
    success: "#4ade80",
    successBg: "rgba(34, 197, 94, 0.2)",
    error: "#f87171",
    errorHover: "#ef4444",
    errorBg: "rgba(239, 68, 68, 0.2)",
    warning: "#fbbf24",
    warningBg: "rgba(234, 179, 8, 0.2)",
    info: "#60a5fa",
    infoBg: "rgba(59, 130, 246, 0.2)",
  },
  text: {
    primary: "#ffffff",
    secondary: "#e4e4e7",
    muted: "#a1a1aa",
    disabled: "#71717a",
  },
  action: {
    deploy: "#60a5fa",
    deployBg: "rgba(96, 165, 250, 0.2)",
    restart: "#fbbf24",
    restartBg: "rgba(251, 191, 36, 0.2)",
    start: "#4ade80",
    startBg: "rgba(74, 222, 128, 0.2)",
    stop: "#f87171",
    stopBg: "rgba(248, 113, 113, 0.2)",
  },
} as const;

export type Colors = typeof colors;
