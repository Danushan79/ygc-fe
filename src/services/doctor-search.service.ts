import { env } from "@/config/env";
import { HttpError } from "@/lib/http-error";
import { applyBayesianRanking } from "@/lib/ranking/bayesian-rating";
import type { DoctorSearchRequest, DoctorSearchResponse, DoctorSearchResult } from "@/types/doctor-search";

const DEFAULT_SEARCH_RADIUS_KM = 5;
const MAX_SEARCH_RADIUS_KM = 30;

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.regularOpeningHours",
  "places.primaryTypeDisplayName",
  "places.businessStatus",
].join(",");

interface GoogleGeocodeResponse {
  status: string;
  error_message?: string;
  results: { geometry: { location: { lat: number; lng: number } } }[];
}

interface GoogleOpeningPoint {
  day: number;
  hour: number;
  minute: number;
}

interface GoogleOpeningPeriod {
  open?: GoogleOpeningPoint;
  close?: GoogleOpeningPoint;
}

interface GooglePlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  primaryTypeDisplayName?: { text: string };
  businessStatus?: string;
  regularOpeningHours?: {
    periods?: GoogleOpeningPeriod[];
    weekdayDescriptions?: string[];
  };
}

interface GooglePlacesSearchResponse {
  places?: GooglePlace[];
  error?: { message?: string };
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/** Great-circle distance between two lat/lng points, in kilometers. */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Best-effort match of the requested date/time against a place's regular opening
 * hours. Google has no real appointment-availability data, so this is only ever
 * "here's what the listed hours say for that day", not a live check. Handles
 * overnight spans (e.g. opens Fri 22:00, closes Sat 02:00). */
function resolveOpenStatus(
  periods: GoogleOpeningPeriod[] | undefined,
  date: string,
  time: string
): DoctorSearchResult["openStatus"] {
  if (!periods || periods.length === 0) return "unknown";

  const weekday = new Date(`${date}T00:00:00`).getDay();
  const [hourStr, minuteStr] = time.split(":");
  const requestedMinutes = Number(hourStr) * 60 + Number(minuteStr);
  if (Number.isNaN(requestedMinutes)) return "unknown";

  for (const period of periods) {
    if (!period.open) continue;

    // No `close` means open 24 hours starting that day.
    if (!period.close) {
      if (period.open.day === weekday) return "open";
      continue;
    }

    const openMinutes = period.open.hour * 60 + period.open.minute;
    const closeMinutes = period.close.hour * 60 + period.close.minute;

    if (period.open.day === period.close.day) {
      if (period.open.day === weekday && requestedMinutes >= openMinutes && requestedMinutes < closeMinutes) {
        return "open";
      }
      continue;
    }

    // Overnight span: check both the day it opens and the day it closes.
    if (period.open.day === weekday && requestedMinutes >= openMinutes) return "open";
    if (period.close.day === weekday && requestedMinutes < closeMinutes) return "open";
  }

  return "closed";
}

function toDoctorSearchResult(
  place: GooglePlace,
  origin: { lat: number; lng: number },
  date: string,
  time: string
): Omit<DoctorSearchResult, "weightedRating"> {
  const lat = place.location?.latitude ?? origin.lat;
  const lng = place.location?.longitude ?? origin.lng;
  const distanceKm = haversineKm(origin.lat, origin.lng, lat, lng);

  const openStatus =
    place.businessStatus === "CLOSED_PERMANENTLY" || place.businessStatus === "CLOSED_TEMPORARILY"
      ? "closed"
      : resolveOpenStatus(place.regularOpeningHours?.periods, date, time);

  return {
    id: place.id,
    name: place.displayName?.text ?? "Unknown",
    specialty: place.primaryTypeDisplayName?.text ?? null,
    address: place.formattedAddress ?? "",
    distanceKm: Math.round(distanceKm * 10) / 10,
    rating: place.rating ?? null,
    ratingCount: place.userRatingCount ?? null,
    phone: place.nationalPhoneNumber ?? place.internationalPhoneNumber ?? null,
    openStatus,
    hours: place.regularOpeningHours?.weekdayDescriptions ?? [],
  };
}

async function geocodeLocation(location: string): Promise<{ lat: number; lng: number }> {
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", location);
  url.searchParams.set("key", env.googlePlacesApiKey!);

  let response: Response;
  try {
    response = await fetch(url.toString());
  } catch {
    throw new HttpError(502, "Unable to reach the location service. Please try again.");
  }

  const payload = (await parseJsonResponse(response)) as GoogleGeocodeResponse | null;

  if (!response.ok || !payload || payload.status !== "OK" || payload.results.length === 0) {
    if (payload?.status === "ZERO_RESULTS") {
      throw new HttpError(400, "We couldn't find that location. Try a more specific address or town.");
    }
    console.error("[geocodeLocation] geocoding failed:", payload?.status, payload?.error_message);
    throw new HttpError(502, "We couldn't look up that location right now. Please try again.");
  }

  return payload.results[0].geometry.location;
}

export async function searchDoctors({
  location,
  date,
  time,
  query,
  radiusKm = DEFAULT_SEARCH_RADIUS_KM,
}: DoctorSearchRequest): Promise<DoctorSearchResponse> {
  if (!env.googlePlacesApiKey) {
    throw new HttpError(500, "Doctor search isn't configured yet.");
  }

  const searchRadiusKm = Math.min(radiusKm, MAX_SEARCH_RADIUS_KM);
  const origin = await geocodeLocation(location);

  let response: Response;
  try {
    response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": env.googlePlacesApiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: query,
        locationBias: {
          circle: {
            center: { latitude: origin.lat, longitude: origin.lng },
            radius: searchRadiusKm * 1000,
          },
        },
        rankPreference: "DISTANCE",
        maxResultCount: 20,
      }),
    });
  } catch {
    throw new HttpError(502, "Unable to reach the doctor search service. Please try again.");
  }

  const payload = (await parseJsonResponse(response)) as GooglePlacesSearchResponse | null;

  if (!response.ok) {
    console.error("[searchDoctors] Places API error:", response.status, payload?.error?.message);
    throw new HttpError(502, "Doctor search failed. Please try again.");
  }

  const nearby = (payload?.places ?? [])
    .map((place) => toDoctorSearchResult(place, origin, date, time))
    .filter((result) => result.distanceKm <= searchRadiusKm);

  // Ranked by weighted_rating (Bayesian average, regressed toward the
  // dataset mean by review count) descending — see bayesian-rating.ts.
  const results = applyBayesianRanking(nearby);

  return { results };
}
