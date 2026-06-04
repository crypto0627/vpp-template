import { NextResponse, NextRequest } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { ETAI_SIMULATION_CONFIG } from "@/config/site-configs";
import { generateReport, type HourlyPowerRecord } from "@/utils/report-generator";

interface EtaiRawRecord {
  datetime: string;
  kW: number;
}

let cachedData: HourlyPowerRecord[] | null = null;
function loadData(): HourlyPowerRecord[] {
  if (!cachedData) {
    const raw: EtaiRawRecord[] = JSON.parse(
      readFileSync(join(process.cwd(), "constants", "ETai_2021_2025.json"), "utf-8"),
    );
    cachedData = raw.map((rec) => ({
      date_timerange: `${rec.datetime}+08:00`,
      "power(kwh)": rec.kW,
    }));
  }
  return cachedData!;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");

    if (!start || !end) {
      return NextResponse.json({ error: "start and end params required" }, { status: 400 });
    }

    const result = generateReport(loadData(), ETAI_SIMULATION_CONFIG, start, end);

    if (result.status === "invalid_range") {
      return NextResponse.json(result.payload, { status: 400 });
    }

    return NextResponse.json(result.payload);
  } catch (error) {
    console.error("Error in etai report API:", error);
    return NextResponse.json(
      { error: "Failed to generate report", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
