import type { ApiResponse } from "@/types/api";

export class ApiRequestError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

export async function sendJson<T>(url: string, method: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiRequestError("Unable to reach the server. Check your connection and try again.");
  }

  let payload: ApiResponse<T> | null = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || !payload || !payload.success) {
    const message =
      payload && !payload.success ? payload.error : "Something went wrong. Please try again.";
    throw new ApiRequestError(message, response.status);
  }

  return payload.data;
}

export async function sendFormData<T>(url: string, formData: FormData): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { method: "POST", body: formData });
  } catch {
    throw new ApiRequestError("Unable to reach the server. Check your connection and try again.");
  }

  let payload: ApiResponse<T> | null = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || !payload || !payload.success) {
    const message =
      payload && !payload.success ? payload.error : "Something went wrong. Please try again.";
    throw new ApiRequestError(message, response.status);
  }

  return payload.data;
}
