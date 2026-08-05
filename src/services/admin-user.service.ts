import { connectToDatabase } from "@/lib/db";
import { countUserDocuments, deleteUserCloudinaryAssets } from "@/lib/cloudinary";
import { HttpError } from "@/lib/http-error";
import { DocumentRecord, PatientSnapshot } from "@/models/document.model";
import { User, type UserAttributes } from "@/models/user.model";
import type { AdminUserListQuery, AdminUserSummaryDto } from "@/types/admin";
import { escapeRegExp } from "@/utils/validation";
import type { QueryFilter } from "mongoose";

function toAdminUserSummaryDto(
  user: Pick<UserAttributes, "fullName" | "email" | "isActive" | "lastLoginAt" | "createdAt"> & {
    _id: unknown;
  },
  documentCount: number,
): AdminUserSummaryDto {
  return {
    id: String(user._id),
    fullName: user.fullName,
    email: user.email,
    isActive: user.isActive,
    joinedAt: (user.createdAt as Date).toISOString(),
    lastLoginAt: user.lastLoginAt ? (user.lastLoginAt as Date).toISOString() : null,
    documentCount,
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

  // Document counts live in Cloudinary (one folder per user_id), not Mongo —
  // fetch per user and fall back to 0 rather than fail the whole list.
  const documentCounts = await Promise.all(
    users.map((user) =>
      countUserDocuments(String(user._id)).catch((error) => {
        console.error(`Failed to count Cloudinary documents for user ${user._id}:`, error);
        return 0;
      }),
    ),
  );

  return users.map((user, index) => toAdminUserSummaryDto(user, documentCounts[index]));
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

  const documentCount = await countUserDocuments(String(user._id)).catch(() => 0);
  return toAdminUserSummaryDto(user, documentCount);
}

export async function deleteUser(userId: string): Promise<void> {
  await connectToDatabase();

  const deleted = await User.findOneAndDelete({ _id: userId, role: "user" }).select("_id");
  if (!deleted) {
    throw new HttpError(404, "User not found.");
  }

  await Promise.all([
    DocumentRecord.deleteMany({ user_id: userId }),
    PatientSnapshot.deleteMany({ user_id: userId }),
  ]);

  // Mongo records are gone regardless of this outcome — don't fail the
  // deletion over a Cloudinary hiccup, just leave a trail to clean up manually.
  await deleteUserCloudinaryAssets(userId).catch((error) => {
    console.error(`Failed to delete Cloudinary assets for user ${userId}:`, error);
  });
}
