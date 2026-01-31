export const typography = {
  fontFamily: {
    regular: "DMSans-Regular",
    medium: "DMSans-Medium",
    semiBold: "DMSans-SemiBold",
    bold: "DMSans-Bold",
  },
  fontSize: {
    xs: 10,
    sm: 11,
    md: 12,
    base: 13,
    lg: 14,
    xl: 16,
    "2xl": 28,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.6,
  },
} as const;

export type Typography = typeof typography;
