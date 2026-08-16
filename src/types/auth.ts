export interface SignUpRequestBody {
  fullName: string;
  email: string;
  password: string;
  mobile?: string;
}

export interface SignInRequestBody {
  email: string;
  password: string;
}

/** Login credentials exchanged for an access token at `POST /api/auth/token`. */
export type AccessTokenRequestBody = SignInRequestBody;

export interface UpdateProfileRequestBody {
  fullName?: string;
  avatarUrl?: string;
  currentPassword?: string;
  newPassword?: string;
}

export type UserRole = "user" | "admin";

export interface AuthUserDto {
  id: string;
  fullName: string;
  email: string;
  mobile?: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface AccessTokenDto {
  accessToken: string;
  tokenType: "Bearer";
  /** Lifetime of the access token in seconds. */
  expiresIn: number;
  expiresAt: string;
  /** Id of the authenticated user — same value as `user.id` and the token's `sub` claim. */
  userId: string;
  user: AuthUserDto;
}
