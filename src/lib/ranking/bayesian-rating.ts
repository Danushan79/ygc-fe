/**
 * Bayesian-average ranking for clinics/hospitals/doctors.
 *
 * A place with 2 reviews at 5.0★ isn't necessarily better than one with 500
 * reviews at 4.2★ — it just hasn't been reviewed enough to trust yet. This
 * pulls low-review ratings toward the dataset mean, weighted by how many
 * reviews back them up, so ranking reflects confidence as well as score.
 *
 * weighted_rating = (v / (v + m)) * R + (m / (v + m)) * C
 *   R = place's own average rating
 *   v = place's review count
 *   m = review count needed before R is trusted at full weight
 *   C = mean rating across the dataset
 */

export type MinReviewsStrategy = "mean" | "median";

/** How `m` is derived from the dataset when no explicit override is given.
 * "median" is more robust than "mean" when a few outliers (e.g. a major
 * hospital with 1000+ reviews) would otherwise drag the threshold way up. */
export const MIN_REVIEWS_STRATEGY: MinReviewsStrategy = "mean";

/** Hard override for m. Set this to a fixed number (e.g. 30 or 50) to always
 * require that many reviews before a place's own rating is trusted at full
 * weight, regardless of the dataset. Leave `null` to derive m dynamically
 * from the dataset per MIN_REVIEWS_STRATEGY on every search. */
export const MIN_REVIEWS_OVERRIDE: number | null = null;

export interface Ratable {
  rating: number | null;
  ratingCount: number | null;
}

export interface DatasetRatingStats {
  /** Minimum-reviews threshold used for this dataset. */
  m: number;
  /** Mean rating across all rated places in the dataset. */
  C: number;
  /** How many places in the dataset actually had a rating to average. */
  ratedCount: number;
}

export interface RankingOptions {
  strategy?: MinReviewsStrategy;
  /** Overrides both MIN_REVIEWS_OVERRIDE and the strategy-derived value. */
  override?: number | null;
}

/**
 * Core Bayesian-average formula. Pure function of its four inputs — no
 * dataset lookups here, so it's trivial to unit test in isolation.
 *
 * v = 0 naturally collapses to C (v / (v + m) = 0), which is the documented
 * behavior for zero-review places: they're ranked at the dataset average
 * rather than excluded, since "no reviews yet" isn't evidence the place is
 * bad — see `applyBayesianRanking` for why we don't drop them from results.
 */
export function bayesianRating(R: number, v: number, m: number, C: number): number {
  if (v <= 0) return C;
  if (m <= 0) return R;
  return (v / (v + m)) * R + (m / (v + m)) * C;
}

/**
 * Computes m and C from the dataset itself — never hardcoded. Places with no
 * rating (or a rating but zero reviews) are excluded from the C/m
 * calculation itself, since an unrated place shouldn't drag down the mean
 * it's about to be regressed toward.
 */
export function computeDatasetRatingStats<T extends Ratable>(
  items: readonly T[],
  options: RankingOptions = {}
): DatasetRatingStats {
  const rated = items.filter(
    (item): item is T & { rating: number; ratingCount: number } =>
      typeof item.rating === "number" && typeof item.ratingCount === "number" && item.ratingCount > 0
  );

  const override = options.override ?? MIN_REVIEWS_OVERRIDE;
  if (rated.length === 0) {
    return { m: override ?? 0, C: 0, ratedCount: 0 };
  }

  const C = rated.reduce((sum, item) => sum + item.rating, 0) / rated.length;

  if (override !== null && override !== undefined) {
    return { m: override, C, ratedCount: rated.length };
  }

  const counts = rated.map((item) => item.ratingCount).sort((a, b) => a - b);
  const strategy = options.strategy ?? MIN_REVIEWS_STRATEGY;
  const m =
    strategy === "median"
      ? counts.length % 2 === 0
        ? (counts[counts.length / 2 - 1] + counts[counts.length / 2]) / 2
        : counts[(counts.length - 1) / 2]
      : counts.reduce((sum, v) => sum + v, 0) / counts.length;

  return { m, C, ratedCount: rated.length };
}

export interface WithWeightedRating {
  weightedRating: number;
}

/**
 * Computes m and C from `items`, applies `bayesianRating` to each one, and
 * returns them re-sorted by weighted_rating descending (primary key). The
 * original `rating`/`ratingCount` are left untouched on the returned objects
 * so callers can compare raw vs. weighted side by side.
 */
export function applyBayesianRanking<T extends Ratable>(
  items: readonly T[],
  options: RankingOptions = {}
): (T & WithWeightedRating)[] {
  const { m, C } = computeDatasetRatingStats(items, options);

  return items
    .map((item) => ({
      ...item,
      weightedRating: bayesianRating(item.rating ?? 0, item.ratingCount ?? 0, m, C),
    }))
    .sort((a, b) => b.weightedRating - a.weightedRating);
}
