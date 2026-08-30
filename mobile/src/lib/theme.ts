/**
 * Mirrors the BrisVO website palette (src/App.css) so the app and the site
 * read as one brand.
 */
export const theme = {
  colors: {
    background: "#0D0D0D",
    surface: "#161616",
    surfaceRaised: "#1F1F1F",
    border: "rgba(255,255,255,0.10)",
    borderStrong: "rgba(255,255,255,0.20)",
    text: "#FFFFFF",
    textMuted: "rgba(255,255,255,0.62)",
    textFaint: "rgba(255,255,255,0.38)",
    accent: "#FF3D57",
    accentSoft: "rgba(255,61,87,0.16)",
    danger: "#FF6B6B",
  },
  radius: { sm: 8, md: 14, lg: 22, pill: 999 },
  spacing: (n: number) => n * 4,
  /** Georgia matches the serif display face used on the website. */
  fonts: {
    display: "Georgia",
    body: "System",
  },
} as const;

export const ACCENT = theme.colors.accent;
