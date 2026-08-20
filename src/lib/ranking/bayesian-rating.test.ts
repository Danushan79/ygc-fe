import { describe, expect, it } from "vitest";
import { applyBayesianRanking, bayesianRating, computeDatasetRatingStats, type Ratable } from "./bayesian-rating";

describe("bayesianRating", () => {
  it("pulls a high rating with very few reviews toward the mean", () => {
    // 2 reviews at 5.0 vs. a dataset mean of 4.0, m = 20: barely trusted yet.
    const score = bayesianRating(5, 2, 20, 4.0);
    expect(score).toBeCloseTo(4.0 + (5 - 4.0) * (2 / 22), 5);
    expect(score).toBeLessThan(4.2);
    expect(score).toBeGreaterThan(4.0);
  });

  it("keeps a moderate rating with many reviews close to its own average", () => {
    // 1000 reviews at 4.0 vs. a dataset mean of 4.5, m = 20: barely moved.
    const score = bayesianRating(4.0, 1000, 20, 4.5);
    expect(score).toBeCloseTo(4.0, 1);
  });

  it("ranks a well-reviewed moderate rating above a barely-reviewed high rating", () => {
    // Same m/C for both: 3 reviews barely earns trust, 500 reviews nearly full trust.
    const m = 25;
    const C = 4.0;
    const fewReviewsHighRating = bayesianRating(4.9, 3, m, C);
    const manyReviewsModerateRating = bayesianRating(4.2, 500, m, C);
    expect(manyReviewsModerateRating).toBeGreaterThan(fewReviewsHighRating);
  });

  it("returns C for zero reviews, regardless of R", () => {
    expect(bayesianRating(5, 0, 20, 4.2)).toBe(4.2);
    expect(bayesianRating(1, 0, 20, 4.2)).toBe(4.2);
  });

  it("returns R when m is 0 (no regression threshold configured)", () => {
    expect(bayesianRating(4.7, 3, 0, 4.0)).toBe(4.7);
  });

  it("converges to R as v grows much larger than m", () => {
    const score = bayesianRating(3.9, 100000, 20, 4.5);
    expect(score).toBeCloseTo(3.9, 3);
  });
});

describe("computeDatasetRatingStats", () => {
  it("computes C as the mean rating across rated places only", () => {
    const items: Ratable[] = [
      { rating: 4, ratingCount: 10 },
      { rating: 5, ratingCount: 20 },
      { rating: null, ratingCount: null },
    ];
    const { C, ratedCount } = computeDatasetRatingStats(items);
    expect(C).toBeCloseTo(4.5, 5);
    expect(ratedCount).toBe(2);
  });

  it("defaults m to the mean review count of rated places", () => {
    const items: Ratable[] = [
      { rating: 4, ratingCount: 10 },
      { rating: 5, ratingCount: 30 },
    ];
    const { m } = computeDatasetRatingStats(items, { strategy: "mean" });
    expect(m).toBe(20);
  });

  it("uses the median review count when strategy is 'median'", () => {
    const items: Ratable[] = [
      { rating: 4, ratingCount: 1 },
      { rating: 4, ratingCount: 8 },
      { rating: 4, ratingCount: 1000 },
    ];
    const { m } = computeDatasetRatingStats(items, { strategy: "median" });
    expect(m).toBe(8);
  });

  it("respects an explicit override regardless of strategy", () => {
    const items: Ratable[] = [
      { rating: 4, ratingCount: 10 },
      { rating: 5, ratingCount: 30 },
    ];
    const { m } = computeDatasetRatingStats(items, { override: 50 });
    expect(m).toBe(50);
  });

  it("returns m = 0, C = 0 when nothing in the dataset has a rating", () => {
    const items: Ratable[] = [
      { rating: null, ratingCount: null },
      { rating: null, ratingCount: 0 },
    ];
    const stats = computeDatasetRatingStats(items);
    expect(stats).toEqual({ m: 0, C: 0, ratedCount: 0 });
  });
});

describe("applyBayesianRanking", () => {
  // Trimmed rating/ratingCount pairs from a real /api/doctors/search response
  // (Vavuniya, Sri Lanka) — a realistic mix of well-reviewed hospitals and
  // small clinics with only 1-2 five-star reviews.
  const realWorldItems: (Ratable & { name: string })[] = [
    { name: "Medi Clinic & Nursing Home", rating: 2.8, ratingCount: 6 },
    { name: "J.R.MEDI CLINIC", rating: 5, ratingCount: 2 },
    { name: "ARUL MARIYON MEDICAL CENTRE", rating: 4.7, ratingCount: 3 },
    { name: "New Animal clinic and Surgery", rating: 4.7, ratingCount: 82 },
    { name: "STS MEDI CLINIC", rating: 4.3, ratingCount: 30 },
    { name: "Dr.K.Chandrakumar's Appolo clinic", rating: null, ratingCount: null },
    { name: "District General Hospital Vavuniya", rating: 3.8, ratingCount: 111 },
    { name: "New Lanka Medicare", rating: 4.8, ratingCount: 16 },
    { name: "Aarkalii Hospital", rating: 3.3, ratingCount: 7 },
    { name: "Chest Clinic", rating: 5, ratingCount: 1 },
    { name: "ST Medi Clinic", rating: 4, ratingCount: 1 },
    { name: "Bharrathy Medi care", rating: 4.4, ratingCount: 8 },
    { name: "Vavuniya Health care Channeling Center", rating: 3, ratingCount: 22 },
    { name: "LIFE CARE FAMILY CLINIC", rating: 5, ratingCount: 1 },
    { name: "Family Medicare", rating: 5, ratingCount: 1 },
    { name: "Arokya Medi Care Center", rating: 5, ratingCount: 1 },
    { name: "Dr. Safana ayurvedic", rating: 5, ratingCount: 5 },
    { name: "Health Care medical center", rating: null, ratingCount: null },
  ];

  it("uses the same m/C the dataset produces to score every place consistently", () => {
    const { m, C } = computeDatasetRatingStats(realWorldItems);
    const ranked = applyBayesianRanking(realWorldItems);

    for (const item of ranked) {
      const expected = bayesianRating(item.rating ?? 0, item.ratingCount ?? 0, m, C);
      expect(item.weightedRating).toBeCloseTo(expected, 10);
    }
  });

  it("pulls a 1-review 5-star clinic's score well below its raw rating", () => {
    const ranked = applyBayesianRanking(realWorldItems);
    const chestClinic = ranked.find((item) => item.name === "Chest Clinic")!;
    expect(chestClinic.rating).toBe(5);
    expect(chestClinic.weightedRating).toBeLessThan(4.7);
  });

  it("keeps a heavily-reviewed hospital's score close to its own (below-average) rating", () => {
    const ranked = applyBayesianRanking(realWorldItems);
    const hospital = ranked.find((item) => item.name === "District General Hospital Vavuniya")!;
    expect(hospital.rating).toBe(3.8);
    // 111 reviews is well over the dataset's m, so it should land close to 3.8,
    // not get dragged up toward the (higher) dataset mean.
    expect(hospital.weightedRating).toBeGreaterThan(3.8);
    expect(hospital.weightedRating).toBeLessThan(4.0);
  });

  it("sorts by weighted_rating descending as the primary key", () => {
    const items: Ratable[] = [
      { rating: 3.3, ratingCount: 7 },
      { rating: 4.8, ratingCount: 16 },
      { rating: 3.8, ratingCount: 111 },
      { rating: 5, ratingCount: 1 },
    ];
    const ranked = applyBayesianRanking(items);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].weightedRating).toBeGreaterThanOrEqual(ranked[i].weightedRating);
    }
  });

  it("preserves raw rating and ratingCount alongside the computed weightedRating", () => {
    const items: Ratable[] = [{ rating: 4.2, ratingCount: 15 }];
    const [ranked] = applyBayesianRanking(items);
    expect(ranked.rating).toBe(4.2);
    expect(ranked.ratingCount).toBe(15);
    expect(typeof ranked.weightedRating).toBe("number");
  });

  it("defaults zero-review / unrated places to the dataset mean C instead of excluding them", () => {
    const items: Ratable[] = [
      { rating: 4.5, ratingCount: 50 },
      { rating: null, ratingCount: null },
    ];
    const ranked = applyBayesianRanking(items);
    const unrated = ranked.find((item) => item.rating === null);
    const { C } = computeDatasetRatingStats(items);
    expect(unrated?.weightedRating).toBe(C);
    // Still present in the output, not filtered out.
    expect(ranked).toHaveLength(2);
  });

  it("handles an entirely unrated dataset without throwing", () => {
    const items: Ratable[] = [
      { rating: null, ratingCount: null },
      { rating: null, ratingCount: null },
    ];
    const ranked = applyBayesianRanking(items);
    expect(ranked.every((item) => item.weightedRating === 0)).toBe(true);
  });
});
