import { NextResponse, NextRequest } from "next/server";
import { NEIHU_SIMULATION_CONFIG } from "@/config/site-configs";
import { generateReport, type HourlyPowerRecord } from "@/utils/report-generator";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");

    if (!start || !end) {
      return NextResponse.json({ error: "start and end params required" }, { status: 400 });
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!apiBaseUrl) {
      return NextResponse.json({ error: "NEXT_PUBLIC_API_BASE_URL is not configured" }, { status: 500 });
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
    const data: HourlyPowerRecord[] = json.data || [];
    const result = generateReport(data, NEIHU_SIMULATION_CONFIG, start, end);

    if (result.status === "invalid_range") {
      return NextResponse.json(result.payload, { status: 400 });
    }

    return NextResponse.json(result.payload);
  } catch (error) {
    console.error("Error in neihu report API:", error);
    return NextResponse.json(
      { error: "Failed to generate report", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
