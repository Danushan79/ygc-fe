import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types/api";

export function apiSuccess<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiResponse<T>>({ success: true, data }, init);
}

export function apiError(message: string, status = 500) {
  return NextResponse.json<ApiResponse<never>>({ success: false, error: message }, { status });
}
