import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/neihu/data?range=today
 *
 * Server-side proxy to the external Neihu API.
 * Avoids CORS issues when the client fetches directly from fortune-ess.com.tw.
 */
export async function GET(request: NextRequest) {
  const range = request.nextUrl.searchParams.get("range") || "today";
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_API_BASE_URL is not configured", data: [] },
      { status: 500 },
    );
  }

  try {
    const url = `${apiUrl}?range=${range}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res
        .text()
        .catch(() => "Unable to read error response");
      return NextResponse.json(
        {
          error: `Upstream API returned ${res.status}: ${errorText}`,
          data: [],
        },
        { status: res.status },
      );
    }

    const json = await res.json();
    return NextResponse.json(json);
  } catch (error) {
    console.error("Failed to proxy neihu data:", error);
    return NextResponse.json(
      {
        error: `Failed to fetch from upstream: ${error instanceof Error ? error.message : "Unknown error"}`,
        data: [],
      },
      { status: 502 },
    );
  }
}
