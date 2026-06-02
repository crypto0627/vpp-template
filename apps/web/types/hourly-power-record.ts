/**
 * Hourly power record from historical data.
 * Originally in utils/report-generator.ts — moved here for template.
 */
export interface HourlyPowerRecord {
  date_timerange: string; // ISO timestamp
  "power(kwh)": number;   // Power consumption for this hour (kWh)
}
