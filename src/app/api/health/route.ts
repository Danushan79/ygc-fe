import { NextResponse } from "next/server";
import { getHealthStatus } from "@/services/health.service";

export function GET() {
  return NextResponse.json(getHealthStatus());
}
