import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME } from "@/constants/auth";
import { verifyAuthToken, type AuthTokenPayload } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db";
import { HttpError } from "@/lib/http-error";
import { User, type UserDocument } from "@/models/user.model";
import { toAuthUserDto } from "@/services/auth.service";
import type { AuthUserDto } from "@/types/auth";

export async function getSession(): Promise<AuthTokenPayload | null> {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  try {
    return verifyAuthToken(token);
  } catch {
    return null;
  }
}

/** Like `getSession`, but also returns the raw JWT so it can be forwarded as a Bearer token to external APIs. */
export async function getSessionWithToken(): Promise<{
  token: string;
  session: AuthTokenPayload;
} | null> {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  try {
    return { token, session: verifyAuthToken(token) };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<AuthTokenPayload> {
  const session = await getSession();

  if (!session) {
    redirect("/signin");
  }

  return session;
}

export async function requireAdminSession(): Promise<AuthTokenPayload> {
  const session = await requireSession();

  if (session.role !== "admin") {
    redirect("/");
  }

  return session;
}

export async function getCurrentUser(): Promise<AuthUserDto | null> {
  const session = await getSession();
  if (!session) {
    return null;
  }

  await connectToDatabase();
  const user: UserDocument | null = await User.findById(session.sub);

  return user ? toAuthUserDto(user) : null;
}

export async function requireCurrentUser(): Promise<AuthUserDto> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  return user;
}

export async function requireAdminUser(): Promise<AuthUserDto> {
  const session = await requireAdminSession();

  await connectToDatabase();
  const user: UserDocument | null = await User.findById(session.sub);

  if (!user) {
    redirect("/signin");
  }

  return toAuthUserDto(user);
}

/** For Route Handlers, where `redirect()` doesn't apply — throws HttpError instead. */
export async function requireAdminApiSession(): Promise<AuthTokenPayload> {
  const session = await getSession();

  if (!session) {
    throw new HttpError(401, "You must be signed in.");
  }
  if (session.role !== "admin") {
    throw new HttpError(403, "Admins only.");
  }

  return session;
}
