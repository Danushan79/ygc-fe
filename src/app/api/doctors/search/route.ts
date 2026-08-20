import { getSession } from "@/lib/auth/session";
import { HttpError } from "@/lib/http-error";
import { searchDoctors } from "@/services/doctor-search.service";
import type { DoctorSearchRequest } from "@/types/doctor-search";
import { apiError, apiSuccess } from "@/utils/api-response";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return apiError("You must be signed in.", 401);
  }

  let body: Partial<DoctorSearchRequest>;
  try {
    body = await request.json();
  } catch {
    return apiError("Request body must be JSON.", 400);
  }

  const { location, date, time, query, radiusKm } = body;

  if (!isNonEmptyString(location) || !isNonEmptyString(date) || !isNonEmptyString(time) || !isNonEmptyString(query)) {
    return apiError("location, date, time, and query are all required.", 400);
  }

  if (date < todayIso()) {
    return apiError("date can't be in the past.", 400);
  }

  if (radiusKm !== undefined && (typeof radiusKm !== "number" || !Number.isFinite(radiusKm) || radiusKm <= 0)) {
    return apiError("radiusKm must be a positive number.", 400);
  }

  try {
    const result = await searchDoctors({ location, date, time, query, radiusKm });
    return apiSuccess(result);
  } catch (error) {
    if (error instanceof HttpError) {
      return apiError(error.message, error.status);
    }
    console.error("Doctor search failed:", error);
    return apiError("Something went wrong. Please try again.", 500);
  }
}
