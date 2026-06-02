/**
 * Claude Brand Chart Color Palette
 * Single source of truth for all chart colors across the application.
 */

export const CHART_COLORS = {
  // Primary series colors — high contrast for chart readability
  coral: "#E8553D", // Load/demand — vivid red-orange
  terracotta: "#2563EB", // Discharge — blue (cool = energy out)
  amber: "#E6A817", // Charge/energy in — saturated gold
  sage: "#16A34A", // Savings/positive — vivid green
  slate: "#1E293B", // Grid/actual usage — near-black
  plum: "#9333EA", // SOC/secondary — vivid purple
  sand: "#BEA98F", // Off-peak/muted

  // Semantic aliases
  load: "#E8553D",
  discharge: "#2563EB",
  grid: "#1E293B",
  charge: "#E6A817",
  soc: "#9333EA",
  savings: "#16A34A",
  peak: "#4A4540",
  offPeak: "#BEA98F",
  warmDark: "#4A4540",

  // Reference lines
  contractLimit: "#E05252",
  pcsCapacity: "#7D9B7E",

  // UI
  background: "#FAF7F4",
  foreground: "#1A1915",
  border: "#E8DDD3",
  muted: "#8B8178",

  // Dark mode overrides
  dark: {
    background: "#1A1915",
    surface: "#262420",
    border: "#3D3A35",
    text: "#F5F0EA",
    textSecondary: "#BEA98F",
    tooltipBg: "#262420",
    tooltipBorder: "#3D3A35",
    gridLine: "#3D3A35",
    axisLabel: "#8B8178",
  },
} as const;

/** Ordered array for dynamic multi-series charts (e.g., yearly comparison) */
export const CHART_COLORS_ARRAY = [
  CHART_COLORS.coral,
  CHART_COLORS.sage,
  CHART_COLORS.amber,
  CHART_COLORS.terracotta,
  CHART_COLORS.plum,
  CHART_COLORS.slate,
  CHART_COLORS.sand,
];
