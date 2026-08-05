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
