/**
 * Frontend Chart Color Palette — dark warm-brown theme (黑底橘棕白)
 */

export const CHART_COLORS = {
  // orange accent — load / demand (primary)
  coral: "#E8883E",
  // sage green — discharge / savings (positive energy)
  terracotta: "#7D9B7E",
  // sky blue — charge / energy stored (cool = storing)
  amber: "#4A9EDB",
  // sage green — savings / positive metrics
  sage: "#7D9B7E",
  // near-white — actual grid usage (brightest = most important)
  slate: "rgba(255,255,255,0.85)",
  // sky blue alias for SOC
  plum: "#4A9EDB",
  // muted brown — off-peak / secondary
  sand: "#BEA98F",

  // Semantic aliases
  load: "#E8883E",
  discharge: "#7D9B7E",
  grid: "rgba(255,255,255,0.85)",
  charge: "#4A9EDB",
  soc: "#4A9EDB",
  savings: "#7D9B7E",
  peak: "#E8883E",
  offPeak: "#BEA98F",
  warmDark: "#3A2415",

  // Reference lines
  contractLimit: "#E05454",
  pcsCapacity: "#7D9B7E",

  // UI tokens (dark theme)
  background: "#1E1208",
  foreground: "#FFFFFF",
  border: "#3A2415",
  muted: "rgba(255,255,255,0.4)",

  // Dark mode chart tokens
  dark: {
    background: "#1E1208",
    surface: "#2A1A0F",
    border: "#3A2415",
    text: "#FFFFFF",
    textSecondary: "#BEA98F",
    tooltipBg: "#241508",
    tooltipBorder: "#3A2415",
    gridLine: "#3A2415",
    axisLabel: "rgba(255,255,255,0.4)",
  },
} as const;

export const CHART_COLORS_ARRAY = [
  CHART_COLORS.coral,
  CHART_COLORS.sage,
  CHART_COLORS.amber,
  "#E05454",
  "#4A9EDB",
  CHART_COLORS.slate,
  CHART_COLORS.sand,
];
