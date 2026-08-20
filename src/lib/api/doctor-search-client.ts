import { sendJson } from "@/lib/api/http-client";
import type { DoctorSearchRequest, DoctorSearchResponse } from "@/types/doctor-search";

export { ApiRequestError } from "@/lib/api/http-client";

export function searchDoctorsRequest(payload: DoctorSearchRequest): Promise<DoctorSearchResponse> {
  return sendJson<DoctorSearchResponse>("/api/doctors/search", "POST", payload);
}
