import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import {
  NEIHU_SIMULATION_CONFIG,
  ETAI_SIMULATION_CONFIG,
  type SiteSimulationConfig,
} from "@/config/site-configs";
import {
  generateReport,
  type HourlyPowerRecord,
} from "@/utils/report-generator";

// Sites with real backend data (telemetry_daily via /data/daily-range)
const BACKEND_SITES = ["neihu"] as const;

// Sites with local JSON data
const JSON_SITES = ["etai"] as const;

// Site config map for history
const SITE_CONFIG_MAP: Record<string, SiteSimulationConfig> = {
  neihu: NEIHU_SIMULATION_CONFIG,
  etai: ETAI_SIMULATION_CONFIG,
};

// ETai raw record format
interface EtaiRawRecord {
  datetime: string;
  kW: number;
}

// Cache for ETai JSON
let etaiCache: HourlyPowerRecord[] | null = null;
function loadEtaiData(): HourlyPowerRecord[] {
  if (!etaiCache) {
    const raw: EtaiRawRecord[] = JSON.parse(
      readFileSync(
        join(process.cwd(), "constants", "ETai_2021_2025.json"),
        "utf-8",
      ),
    );
    etaiCache = raw.map((rec) => ({
      date_timerange: `${rec.datetime}+08:00`,
      "power(kwh)": rec.kW,
    }));
  }
  return etaiCache;
}

/**
 * GET /api/history/[siteId]?start=YYYY-MM-DD&end=YYYY-MM-DD&granularity=daily|hourly
 *
 * Returns historical data with BESS simulation for the given site and date range.
 * - neihu: proxies to backend /data/daily-range for raw data, uses /hourly for report
 * - etai: reads from local JSON
 * - others: returns error (no data)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const { siteId } = await params;
  const start = request.nextUrl.searchParams.get("start");
  const end = request.nextUrl.searchParams.get("end");
  const granularity =
    (request.nextUrl.searchParams.get("granularity") as
      | "daily"
      | "hourly"
      | null) || "daily";

  if (!start || !end) {
    return NextResponse.json(
      { error: "start and end params required (YYYY-MM-DD)" },
      { status: 400 },
    );
  }

  const config = SITE_CONFIG_MAP[siteId];
  if (!config) {
    return NextResponse.json(
      { error: `Site '${siteId}' does not have historical data` },
      { status: 404 },
    );
  }

  try {
    // Both granularities use the report generator for BESS simulation
    // The report generator works on hourly data and produces daily breakdowns
    let hourlyData: HourlyPowerRecord[];

    if ((BACKEND_SITES as readonly string[]).includes(siteId)) {
      // Fetch hourly data from backend
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!apiBaseUrl) {
        return NextResponse.json(
          { error: "NEXT_PUBLIC_API_BASE_URL is not configured" },
          { status: 500 },
        );
      }

      const backendBase = apiBaseUrl.replace(/\/data\/?$/, "");
      const hourlyUrl = `${backendBase}/hourly?start=${start}&end=${end}`;

      const res = await fetch(hourlyUrl, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error");
        return NextResponse.json(
          { error: `Backend API returned ${res.status}: ${errorText}` },
          { status: res.status },
        );
      }

      const json = await res.json();
      hourlyData = json.data || [];
    } else if ((JSON_SITES as readonly string[]).includes(siteId)) {
      hourlyData = loadEtaiData();
    } else {
      return NextResponse.json(
        { error: `No data source for site '${siteId}'` },
        { status: 404 },
      );
    }

    // Generate report with BESS simulation
    const result = generateReport(hourlyData, config, start, end);

    if (result.status === "invalid_range") {
      return NextResponse.json(result.payload, { status: 400 });
    }

    // For hourly granularity, also include the raw hourly data filtered to range
    if (granularity === "hourly") {
      const msStart = new Date(`${start}T00:00:00+08:00`).getTime();
      const msEnd = new Date(`${end}T23:59:59.999+08:00`).getTime();

      const filteredHourly = hourlyData.filter((rec) => {
        const t = new Date(rec.date_timerange).getTime();
        return t >= msStart && t <= msEnd;
      });

      return NextResponse.json({
        ...(result.payload as object),
        granularity: "hourly",
        hourlyData: filteredHourly,
      });
    }

    return NextResponse.json({
      ...(result.payload as object),
      granularity: "daily",
    });
  } catch (error) {
    console.error(`Error in history API for ${siteId}:`, error);
    return NextResponse.json(
      {
        error: "Failed to fetch historical data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
