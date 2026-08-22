import { describe, expect, it } from "vitest";
import { dailyIndexForDate, dateKeyUTC, msUntilNextUtcMidnight } from "@/lib/game/dailyTarget";

describe("dateKeyUTC", () => {
  it("formats a date as YYYY-MM-DD in UTC", () => {
    expect(dateKeyUTC(new Date("2026-08-22T23:59:59.000Z"))).toBe("2026-08-22");
    expect(dateKeyUTC(new Date("2026-01-01T00:00:00.000Z"))).toBe("2026-01-01");
  });
});

describe("dailyIndexForDate", () => {
  it("is deterministic — same date, same pool size, always yields the same index", () => {
    const a = dailyIndexForDate("2026-08-22", 150);
    const b = dailyIndexForDate("2026-08-22", 150);
    expect(a).toBe(b);
  });

  it("produces an index within [0, poolSize)", () => {
    for (const dateKey of ["2026-01-01", "2026-06-15", "2027-12-31"]) {
      const index = dailyIndexForDate(dateKey, 37);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(37);
    }
  });

  it("different dates generally produce different indices", () => {
    const indices = new Set(
      Array.from({ length: 30 }, (_, i) => dailyIndexForDate(`2026-01-${String(i + 1).padStart(2, "0")}`, 150)),
    );
    // With a 150-slot pool and a real hash, 30 consecutive days should not
    // all collapse onto the same handful of indices.
    expect(indices.size).toBeGreaterThan(15);
  });

  it("throws for a non-positive pool size", () => {
    expect(() => dailyIndexForDate("2026-01-01", 0)).toThrow();
  });
});

describe("msUntilNextUtcMidnight", () => {
  it("returns exactly one day when called at midnight UTC", () => {
    const midnight = new Date("2026-08-22T00:00:00.000Z");
    expect(msUntilNextUtcMidnight(midnight)).toBe(24 * 60 * 60 * 1000);
  });

  it("returns a smaller value the closer to midnight it's called", () => {
    const almostMidnight = new Date("2026-08-22T23:59:00.000Z");
    expect(msUntilNextUtcMidnight(almostMidnight)).toBe(60 * 1000);
  });
});
