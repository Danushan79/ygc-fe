import { sendJson } from "@/lib/api/http-client";
import type {
  AccessTokenDto,
  AccessTokenRequestBody,
  AuthUserDto,
  SignInRequestBody,
  SignUpRequestBody,
  UpdateProfileRequestBody,
} from "@/types/auth";

export { ApiRequestError } from "@/lib/api/http-client";

export function signUpRequest(body: SignUpRequestBody): Promise<AuthUserDto> {
  return sendJson<AuthUserDto>("/api/auth/signup", "POST", body);
}

export function signInRequest(body: SignInRequestBody): Promise<AuthUserDto> {
  return sendJson<AuthUserDto>("/api/auth/signin", "POST", body);
}

export function createAccessTokenRequest(body: AccessTokenRequestBody): Promise<AccessTokenDto> {
  return sendJson<AccessTokenDto>("/api/auth/token", "POST", body);
}

export function updateProfileRequest(body: UpdateProfileRequestBody): Promise<AuthUserDto> {
  return sendJson<AuthUserDto>("/api/auth/profile", "PATCH", body);
}

export function signOutRequest(): Promise<{ signedOut: true }> {
  return sendJson<{ signedOut: true }>("/api/auth/signout", "POST", {});
}
