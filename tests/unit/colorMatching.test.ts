import { describe, expect, it } from "vitest";
import { compareColor } from "@/lib/game/colorMatching";

describe("compareColor", () => {
  it("returns correct for an exact match", () => {
    expect(compareColor("red", "red")).toBe("correct");
  });

  it("returns partial for an adjacent/related color", () => {
    expect(compareColor("orange", "red")).toBe("partial");
    expect(compareColor("yellow", "orange")).toBe("partial");
  });

  it("returns incorrect for unrelated colors", () => {
    expect(compareColor("red", "blue")).toBe("incorrect");
    expect(compareColor("black", "yellow")).toBe("incorrect");
  });

  it("never treats multicolor as partial with anything", () => {
    expect(compareColor("multicolor", "red")).toBe("incorrect");
    expect(compareColor("red", "multicolor")).toBe("incorrect");
    expect(compareColor("multicolor", "multicolor")).toBe("correct");
  });

  it("adjacency is not necessarily symmetric by construction, but is for this table", () => {
    // Spot check both directions for a pair to document the intended symmetry.
    expect(compareColor("green", "blue")).toBe("partial");
    expect(compareColor("blue", "green")).toBe("partial");
  });
});
