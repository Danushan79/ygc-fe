import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import { AUTH_TOKEN_TTL_SECONDS } from "@/constants/auth";
import type { UserRole } from "@/types/auth";

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

function getJwtSecret(): string {
  if (!env.jwtSecret) {
    throw new Error("JWT_SECRET is not set. Configure it in your .env file.");
  }

  return env.jwtSecret;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: AUTH_TOKEN_TTL_SECONDS });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  return jwt.verify(token, getJwtSecret()) as AuthTokenPayload;
}
