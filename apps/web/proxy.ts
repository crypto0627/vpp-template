import { NextResponse } from "next/server";

export function proxy() {
  const nonce = crypto.randomUUID().replace(/-/g, "");

  const res = NextResponse.next();

  const csp = `
    default-src 'self'; 
    script-src 'self' 'nonce-${nonce}' https://static.cloudflareinsights.com https://www.googletagmanager.com; 
    style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; 
    img-src 'self' data: https:; 
    font-src 'self' https://cdn.jsdelivr.net https://cdn.jsdelivr.net/npm/bootstrap-icons@1.3.0; 
    connect-src 'self' https://tiles.openfreemap.org https://opendata.cwa.gov.tw https://www.google-analytics.com; 
    frame-src 'self' https://www.youtube.com; 
    worker-src 'self' blob:;
  `.replace(/\n/g, "");

  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("x-nonce", nonce);

  return res;
}
