import { describe, expect, it } from "vitest";
import { compareCase } from "@/lib/game/caseMatching";

describe("compareCase", () => {
  it("returns correct when the case name and type both match", () => {
    expect(
      compareCase(
        { caseOrCollection: "Operation Phoenix Weapon Case", caseType: "case" },
        { caseOrCollection: "Operation Phoenix Weapon Case", caseType: "case" },
      ),
    ).toBe("correct");
  });

  it("returns incorrect when the case name differs", () => {
    expect(
      compareCase(
        { caseOrCollection: "Chroma Case", caseType: "case" },
        { caseOrCollection: "Operation Phoenix Weapon Case", caseType: "case" },
      ),
    ).toBe("incorrect");
  });

  it("returns incorrect when names match but the type differs (case vs collection)", () => {
    expect(
      compareCase(
        { caseOrCollection: "The Phoenix Collection", caseType: "collection" },
        { caseOrCollection: "The Phoenix Collection", caseType: "case" },
      ),
    ).toBe("incorrect");
  });

  it("returns incorrect when only one side has no known case/collection", () => {
    expect(
      compareCase({ caseOrCollection: null, caseType: null }, { caseOrCollection: "Chroma Case", caseType: "case" }),
    ).toBe("incorrect");
  });

  it("returns correct when both sides have no known case/collection", () => {
    // Regression test: a skin with no case data (e.g. M4A4 | Howl, pulled
    // from cases entirely) must still score "correct" against itself, or
    // it becomes an unwinnable target the moment it's picked.
    expect(compareCase({ caseOrCollection: null, caseType: null }, { caseOrCollection: null, caseType: null })).toBe(
      "correct",
    );
  });
});
