/** Request body for POST /api/doctors/search. `date`/`time` are never used to
 * filter results — Google has no real appointment-availability data — they're
 * only used to compute each result's best-effort `openStatus`. `query` is the
 * free-text search built from the consult recommendation (e.g. "cardiologist
 * doctor", "pharmacy"). */
export interface DoctorSearchRequest {
  location: string;
  date: string;
  time: string;
  query: string;
  /** Search radius in kilometers. Defaults to 5 when omitted; used to widen
   * the search after a zero-result search. */
  radiusKm?: number;
}

export interface DoctorSearchResult {
  id: string;
  name: string;
  specialty: string | null;
  address: string;
  distanceKm: number;
  rating: number | null;
  ratingCount: number | null;
  /** Bayesian-average rating (regressed toward the dataset mean by review
   * count) used to rank results — see `weighted_rating` in
   * `src/lib/ranking/bayesian-rating.ts`. Always present, even when `rating`
   * is null: a place with no reviews yet is scored at the dataset mean
   * rather than excluded from results. */
  weightedRating: number;
  phone: string | null;
  /** Best-effort match of the requested date/time against the place's regular
   * opening hours. "unknown" when Google has no opening-hours data for it. */
  openStatus: "open" | "closed" | "unknown";
  hours: string[];
}

export interface DoctorSearchResponse {
  results: DoctorSearchResult[];
}
