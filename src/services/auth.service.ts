import { connectToDatabase } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { signAuthToken } from "@/lib/auth/jwt";
import { uploadAvatar } from "@/lib/cloudinary";
import { HttpError } from "@/lib/http-error";
import { User, type UserDocument } from "@/models/user.model";
import {
  AUTH_TOKEN_TTL_SECONDS,
  MAX_AVATAR_DATA_URL_LENGTH,
  MIN_PASSWORD_LENGTH,
} from "@/constants/auth";
import { isValidEmail, isValidMobile } from "@/utils/validation";
import type {
  AccessTokenDto,
  AccessTokenRequestBody,
  AuthUserDto,
  SignInRequestBody,
  SignUpRequestBody,
  UpdateProfileRequestBody,
} from "@/types/auth";

interface AuthResult {
  user: AuthUserDto;
  token: string;
}

export function toAuthUserDto(user: UserDocument): AuthUserDto {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    mobile: user.mobile ?? undefined,
    role: user.role,
    avatarUrl: user.avatarUrl ?? undefined,
  };
}

export async function signUp(body: SignUpRequestBody): Promise<AuthResult> {
  const fullName = body.fullName?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const mobile = body.mobile?.trim() || undefined;

  if (fullName.length < 2) {
    throw new HttpError(400, "Full name is required.");
  }
  if (!isValidEmail(email)) {
    throw new HttpError(400, "Enter a valid email address.");
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new HttpError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  if (mobile && !isValidMobile(mobile)) {
    throw new HttpError(400, "Enter a valid mobile number.");
  }

  await connectToDatabase();

  const existing = await User.findOne(mobile ? { $or: [{ email }, { mobile }] } : { email })
    .select("email mobile")
    .lean<{ email: string; mobile?: string }>();

  if (existing) {
    if (existing.email === email) {
      throw new HttpError(409, "An account with this email already exists.");
    }
    throw new HttpError(409, "An account with this mobile number already exists.");
  }

  const passwordHash = await hashPassword(password);
  // Role is always "user" here — admin accounts are never created through signup.
  const created: UserDocument = await User.create({
    fullName,
    email,
    mobile,
    passwordHash,
    role: "user",
  });

  const token = signAuthToken({
    sub: created._id.toString(),
    email: created.email,
    role: created.role,
  });
  return { user: toAuthUserDto(created), token };
}

export async function signIn(body: SignInRequestBody): Promise<AuthResult> {
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  if (!isValidEmail(email)) {
    throw new HttpError(400, "Enter a valid email address.");
  }
  if (!password) {
    throw new HttpError(400, "Password is required.");
  }

  await connectToDatabase();

  const user: UserDocument | null = await User.findOne({ email }).select("+passwordHash");
  if (!user) {
    throw new HttpError(401, "Invalid email or password.");
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (!passwordMatches) {
    throw new HttpError(401, "Invalid email or password.");
  }

  if (!user.isActive) {
    throw new HttpError(403, "Your account has been deactivated. Please contact support.");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signAuthToken({ sub: user._id.toString(), email: user.email, role: user.role });
  return { user: toAuthUserDto(user), token };
}

/**
 * Verifies login credentials and mints an access token for API clients that
 * send `Authorization: Bearer <token>` instead of using the session cookie.
 */
export async function createAccessToken(body: AccessTokenRequestBody): Promise<AccessTokenDto> {
  const { user, token } = await signIn(body);

  return {
    accessToken: token,
    tokenType: "Bearer",
    expiresIn: AUTH_TOKEN_TTL_SECONDS,
    expiresAt: new Date(Date.now() + AUTH_TOKEN_TTL_SECONDS * 1000).toISOString(),
    userId: user.id,
    user,
  };
}

export async function updateProfile(
  userId: string,
  body: UpdateProfileRequestBody,
): Promise<AuthUserDto> {
  const fullName = body.fullName?.trim();

  if (fullName !== undefined && fullName.length < 2) {
    throw new HttpError(400, "Full name is required.");
  }
  if (body.avatarUrl !== undefined && body.avatarUrl.length > MAX_AVATAR_DATA_URL_LENGTH) {
    throw new HttpError(400, "Profile photo is too large.");
  }

  await connectToDatabase();

  const user: UserDocument | null = await User.findById(userId).select("+passwordHash");
  if (!user) {
    throw new HttpError(404, "Account not found.");
  }

  // Email is not editable through profile updates.
  if (fullName) {
    user.fullName = fullName;
  }

  if (body.avatarUrl !== undefined) {
    if (body.avatarUrl) {
      if (!body.avatarUrl.startsWith("data:image/")) {
        throw new HttpError(400, "Profile photo must be an image.");
      }
      try {
        user.avatarUrl = await uploadAvatar(body.avatarUrl, userId);
      } catch (error) {
        console.error("Cloudinary avatar upload failed:", error);
        throw new HttpError(502, "Failed to upload profile photo. Please try again.");
      }
    } else {
      user.avatarUrl = undefined;
    }
  }

  if (body.newPassword) {
    if (!body.currentPassword) {
      throw new HttpError(400, "Enter your current password to set a new one.");
    }

    const currentPasswordMatches = await verifyPassword(body.currentPassword, user.passwordHash);
    if (!currentPasswordMatches) {
      throw new HttpError(401, "Current password is incorrect.");
    }

    if (body.newPassword.length < MIN_PASSWORD_LENGTH) {
      throw new HttpError(400, `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    }

    user.passwordHash = await hashPassword(body.newPassword);
  }

  await user.save();

  return toAuthUserDto(user);
}
