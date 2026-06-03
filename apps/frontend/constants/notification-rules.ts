export const SITE_NAMES: Record<string, string> = {
  neihu: "內湖",
  etai: "億泰電纜",
};

export const NOTIFICATION_THRESHOLDS = {
  neihu: {
    socLowPct: 15,
    socFullPct: 95,
    powerWarnRatio: 0.9,
    powerCriticalRatio: 1.0,
    contractKW: 432,
    dataStaleMinutes: 15,
  },
  etai: {
    contractKW: 2700,
    drStartMonth: 5,
    drStartDay: 1,
    drEndMonth: 10,
    drEndDay: 31,
  },
} as const;

export const NOTIFICATION_COOLDOWNS_MS: Record<string, number> = {
  "neihu-soc-low": 30 * 60 * 1000,
  "neihu-soc-full": 60 * 60 * 1000,
  "neihu-power-warning": 15 * 60 * 1000,
  "neihu-power-critical": 10 * 60 * 1000,
  "neihu-data-stale": 30 * 60 * 1000,
  "neihu-charger-idle": 60 * 60 * 1000,
  "etai-dr-season-active": 24 * 60 * 60 * 1000,
};
