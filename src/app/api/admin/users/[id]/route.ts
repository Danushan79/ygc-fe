import { Types } from "mongoose";
import type { NextRequest } from "next/server";
import { requireAdminApiSession } from "@/lib/auth/session";
import { HttpError } from "@/lib/http-error";
import { deleteUser, setUserActive } from "@/services/admin-user.service";
import { apiError, apiSuccess } from "@/utils/api-response";

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/users/[id]">) {
  try {
    await requireAdminApiSession();

    const { id } = await ctx.params;
    if (!Types.ObjectId.isValid(id)) {
      return apiError("Invalid user id.", 400);
    }

    const body = await request.json().catch(() => null);
    if (typeof body?.isActive !== "boolean") {
      return apiError("isActive must be a boolean.", 400);
    }

    const user = await setUserActive(id, body.isActive);
    return apiSuccess(user);
  } catch (error) {
    if (error instanceof HttpError) {
      return apiError(error.message, error.status);
    }
    console.error("Failed to update user status:", error);
    return apiError("Something went wrong. Please try again.", 500);
  }
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/admin/users/[id]">) {
  try {
    await requireAdminApiSession();

    const { id } = await ctx.params;
    if (!Types.ObjectId.isValid(id)) {
      return apiError("Invalid user id.", 400);
    }

    await deleteUser(id);
    return apiSuccess({ deleted: true });
  } catch (error) {
    if (error instanceof HttpError) {
      return apiError(error.message, error.status);
    }
    console.error("Failed to delete user:", error);
    return apiError("Something went wrong. Please try again.", 500);
  }
}
