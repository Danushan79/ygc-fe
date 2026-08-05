import { getSessionWithToken } from "@/lib/auth/session";
import { HttpError } from "@/lib/http-error";
import { uploadDocuments } from "@/services/document.service";
import { apiError, apiSuccess } from "@/utils/api-response";

export async function POST(request: Request) {
  const auth = await getSessionWithToken();
  if (!auth) {
    return apiError("You must be signed in.", 401);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return apiError("Request body must be multipart form data.", 400);
  }

  if (formData.getAll("files").length === 0) {
    return apiError("At least one file is required.", 400);
  }

  try {
    const result = await uploadDocuments(formData, {
      token: auth.token,
      userId: auth.session.sub,
    });
    return apiSuccess(result);
  } catch (error) {
    if (error instanceof HttpError) {
      return apiError(error.message, error.status);
    }
    console.error("Document upload failed:", error);
    return apiError("Something went wrong. Please try again.", 500);
  }
}
