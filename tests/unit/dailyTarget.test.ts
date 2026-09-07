import { describe, expect, it } from "vitest";
import {
  dailyIndexForDate,
  dateKeyEastern,
  msUntilNextDailyReset,
  nextDailyResetAt,
  nextDateKey,
  previousDateKey,
  shiftDateKey,
} from "@/lib/game/dailyTarget";

describe("dateKeyEastern", () => {
  it("formats the Eastern calendar date as YYYY-MM-DD", () => {
    // 12:00 UTC on 22 Aug is 08:00 the same morning in New York.
    expect(dateKeyEastern(new Date("2026-08-22T12:00:00.000Z"))).toBe("2026-08-22");
  });

  it("still reports the previous day just before Eastern midnight", () => {
    // 03:59 UTC = 23:59 the evening before, during daylight saving (UTC-4).
    expect(dateKeyEastern(new Date("2026-08-23T03:59:00.000Z"))).toBe("2026-08-22");
  });

  it("rolls over to the new day exactly at Eastern midnight", () => {
    expect(dateKeyEastern(new Date("2026-08-23T04:00:00.000Z"))).toBe("2026-08-23");
  });

  it("uses the standard-time offset in winter", () => {
    // Outside daylight saving Eastern is UTC-5, so midnight lands at 05:00 UTC.
    expect(dateKeyEastern(new Date("2026-01-15T04:59:00.000Z"))).toBe("2026-01-14");
    expect(dateKeyEastern(new Date("2026-01-15T05:00:00.000Z"))).toBe("2026-01-15");
  });

  it("gives every player the same key for one instant, whatever their own clock says", () => {
    // The key is derived from a fixed zone on the server, so a player in
    // Tokyo and one in Los Angeles are playing the same daily.
    const instant = new Date("2026-08-22T18:30:00.000Z");
    expect(dateKeyEastern(instant)).toBe("2026-08-22");
    expect(dateKeyEastern(new Date(instant.getTime()))).toBe(dateKeyEastern(instant));
  });
});

describe("date key arithmetic", () => {
  it("steps backwards and forwards a calendar day at a time", () => {
    expect(previousDateKey("2026-08-22")).toBe("2026-08-21");
    expect(nextDateKey("2026-08-22")).toBe("2026-08-23");
  });

  it("crosses month and year boundaries", () => {
    expect(nextDateKey("2026-01-31")).toBe("2026-02-01");
    expect(previousDateKey("2026-01-01")).toBe("2025-12-31");
    expect(nextDateKey("2028-02-28")).toBe("2028-02-29"); // leap year
  });

  it("is unaffected by daylight saving, being pure calendar maths", () => {
    // 8 March 2026 is the spring-forward day in the US.
    expect(nextDateKey("2026-03-07")).toBe("2026-03-08");
    expect(previousDateKey("2026-03-09")).toBe("2026-03-08");
    expect(shiftDateKey("2026-03-06", 4)).toBe("2026-03-10");
  });
});

describe("msUntilNextDailyReset", () => {
  it("returns a full day when called exactly at Eastern midnight", () => {
    // 04:00 UTC on 22 Aug is midnight in New York under daylight saving.
    const easternMidnight = new Date("2026-08-22T04:00:00.000Z");
    expect(msUntilNextDailyReset(easternMidnight)).toBe(24 * 60 * 60 * 1000);
  });

  it("shrinks as the reset approaches", () => {
    const oneMinuteBefore = new Date("2026-08-23T03:59:00.000Z");
    expect(msUntilNextDailyReset(oneMinuteBefore)).toBe(60 * 1000);
  });

  it("counts toward 05:00 UTC in winter, when Eastern is UTC-5", () => {
    const winterMidnight = new Date("2026-01-15T05:00:00.000Z");
    expect(nextDailyResetAt(winterMidnight).toISOString()).toBe("2026-01-16T05:00:00.000Z");
  });

  it("hands back a 23-hour day across the spring-forward transition", () => {
    // Midnight 8 Mar 2026 Eastern is 05:00 UTC; clocks jump at 02:00 local,
    // so the next midnight arrives at 04:00 UTC — 23 hours later, not 24.
    const springForwardMidnight = new Date("2026-03-08T05:00:00.000Z");
    expect(nextDailyResetAt(springForwardMidnight).toISOString()).toBe("2026-03-09T04:00:00.000Z");
    expect(msUntilNextDailyReset(springForwardMidnight)).toBe(23 * 60 * 60 * 1000);
  });

  it("hands back a 25-hour day across the fall-back transition", () => {
    // 1 Nov 2026 is the fall-back day: midnight is 04:00 UTC and the next
    // one is 05:00 UTC, so the day is an hour longer.
    const fallBackMidnight = new Date("2026-11-01T04:00:00.000Z");
    expect(nextDailyResetAt(fallBackMidnight).toISOString()).toBe("2026-11-02T05:00:00.000Z");
    expect(msUntilNextDailyReset(fallBackMidnight)).toBe(25 * 60 * 60 * 1000);
  });

  it("always lands on an actual Eastern midnight", () => {
    for (const iso of [
      "2026-01-15T12:00:00.000Z",
      "2026-03-08T06:30:00.000Z",
      "2026-07-04T22:15:00.000Z",
      "2026-11-01T05:30:00.000Z",
    ]) {
      const reset = nextDailyResetAt(new Date(iso));
      const local = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        hourCycle: "h23",
        hour: "2-digit",
        minute: "2-digit",
      }).format(reset);
      expect(local).toBe("00:00");
      expect(reset.getTime()).toBeGreaterThan(new Date(iso).getTime());
    }
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

  it("gives consecutive Eastern days different targets", () => {
    const today = dailyIndexForDate("2026-08-22", 2000);
    const tomorrow = dailyIndexForDate("2026-08-23", 2000);
    expect(today).not.toBe(tomorrow);
  });

  it("throws for a non-positive pool size", () => {
    expect(() => dailyIndexForDate("2026-01-01", 0)).toThrow();
  });
});
