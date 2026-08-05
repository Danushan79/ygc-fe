import type { NextResponse } from "next/server";
import { isProduction } from "@/config/env";
import { AUTH_COOKIE_NAME, AUTH_TOKEN_TTL_SECONDS } from "@/constants/auth";

export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_TOKEN_TTL_SECONDS,
  });
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
