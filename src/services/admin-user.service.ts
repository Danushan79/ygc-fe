import { connectToDatabase } from "@/lib/db";
import { HttpError } from "@/lib/http-error";
import { User, type UserAttributes } from "@/models/user.model";
import type { AdminUserListQuery, AdminUserSummaryDto } from "@/types/admin";
import { escapeRegExp } from "@/utils/validation";
import type { QueryFilter } from "mongoose";

function toAdminUserSummaryDto(
  user: Pick<UserAttributes, "fullName" | "email" | "isActive" | "lastLoginAt" | "createdAt"> & {
    _id: unknown;
  },
): AdminUserSummaryDto {
  return {
    id: String(user._id),
    fullName: user.fullName,
    email: user.email,
    isActive: user.isActive,
    joinedAt: (user.createdAt as Date).toISOString(),
    lastLoginAt: user.lastLoginAt ? (user.lastLoginAt as Date).toISOString() : null,
    // Document uploads aren't tracked yet — always zero for now.
    documentCount: 0,
  };
}

export async function listUsers(query: AdminUserListQuery): Promise<AdminUserSummaryDto[]> {
  await connectToDatabase();

  const filter: QueryFilter<UserAttributes> = { role: "user" };

  const search = query.search?.trim();
  if (search) {
    const pattern = new RegExp(escapeRegExp(search), "i");
    filter.$or = [{ fullName: pattern }, { email: pattern }];
  }

  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) {
      const from = new Date(query.from);
      if (!Number.isNaN(from.getTime())) {
        filter.createdAt.$gte = from;
      }
    }
    if (query.to) {
      const to = new Date(query.to);
      if (!Number.isNaN(to.getTime())) {
        to.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = to;
      }
    }
  }

  const users = await User.find(filter)
    .select("fullName email isActive lastLoginAt createdAt")
    .sort({ createdAt: -1 })
    .lean();

  return users.map(toAdminUserSummaryDto);
}

export async function setUserActive(
  userId: string,
  isActive: boolean,
): Promise<AdminUserSummaryDto> {
  await connectToDatabase();

  const user = await User.findOneAndUpdate(
    { _id: userId, role: "user" },
    { isActive },
    { new: true },
  ).select("fullName email isActive lastLoginAt createdAt");

  if (!user) {
    throw new HttpError(404, "User not found.");
  }

  return toAdminUserSummaryDto(user);
}

export async function deleteUser(userId: string): Promise<void> {
  await connectToDatabase();

  const deleted = await User.findOneAndDelete({ _id: userId, role: "user" }).select("_id");
  if (!deleted) {
    throw new HttpError(404, "User not found.");
  }
}
