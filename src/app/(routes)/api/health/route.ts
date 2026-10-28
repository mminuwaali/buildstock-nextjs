import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    mode: "mock",
    backend_configured: false,
    timestamp: new Date().toISOString(),
  });
}
