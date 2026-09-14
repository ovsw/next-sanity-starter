import { describe, expect, it } from "vitest";
import {
  resolveSectionBands,
  resolveSectionBoundaries,
  resolveSectionTheme,
} from "./section-boundaries";

describe("Page Builder section boundaries", () => {
  it.each([
    [undefined, "light"],
    [null, "light"],
    ["invalid", "light"],
    ["dark", "dark"],
  ])("resolves %s to %s", (value, expected) => {
    expect(resolveSectionTheme(value)).toBe(expected);
  });

  it("resolves visible joins and preserves outer boundaries", () => {
    expect(
      resolveSectionBoundaries([
        { key: "first", theme: "light" },
        { key: "same", theme: "light" },
        { key: "different", theme: "dark" },
        { key: "unknown", theme: null },
        { key: "hero", kind: "hero" },
      ]),
    ).toEqual([
      { key: "first", theme: "light", top: "outer", bottom: "seam", topTreatment: "none", topTuck: false },
      { key: "same", theme: "light", top: "seam", bottom: "edge", topTreatment: "none", topTuck: false },
      { key: "different", theme: "dark", top: "edge", bottom: "edge", topTreatment: "none", topTuck: false },
      { key: "unknown", theme: null, top: "edge", bottom: "edge", topTreatment: "none", topTuck: false },
      { key: "hero", theme: null, top: "edge", bottom: "outer", topTreatment: "none", topTuck: false },
    ]);
  });

  it("compares preview-encoded themes after cleaning them", () => {
    const hidden = String.fromCodePoint(8203, 8203, 8203, 8203);
    const encodedDark = `dark${hidden}`;
    expect(resolveSectionTheme(encodedDark)).toBe("dark");
    expect(
      resolveSectionBoundaries([
        { key: "one", theme: encodedDark },
        { key: "two", theme: "dark", edgeTreatment: "wave" },
      ]).map(({ top, bottom }) => [top, bottom]),
    ).toEqual([
      ["outer", "seam"],
      ["seam", "outer"],
    ]);
  });

  it("enables a wave tuck only at a different-background join", () => {
    const [, edge, matching] = resolveSectionBoundaries([
      { key: "light", theme: "light" },
      { key: "dark-wave", theme: "dark", edgeTreatment: "wave" },
      { key: "dark-wave-2", theme: "dark", edgeTreatment: "wave" },
    ]);
    expect(edge).toMatchObject({ top: "edge", topTreatment: "wave", topTuck: true });
    expect(matching).toMatchObject({ top: "seam", topTreatment: "none", topTuck: false });
  });

  it("groups seam-joined sections into bands and marks a tucked lead", () => {
    expect(
      resolveSectionBands(
        resolveSectionBoundaries([
          { key: "hero", kind: "hero" },
          { key: "a", theme: "light" },
          { key: "b", theme: "light" },
          { key: "c", theme: "dark", edgeTreatment: "wave" },
          { key: "d", theme: "dark" },
          { key: "e", theme: "dark", edgeTreatment: "wave" },
          { key: "f", theme: "light" },
        ]),
      ),
    ).toEqual([
      { keys: ["hero"], theme: null, tuck: false },
      { keys: ["a", "b"], theme: "light", tuck: false },
      { keys: ["c", "d", "e"], theme: "dark", tuck: true },
      { keys: ["f"], theme: "light", tuck: false },
    ]);
  });
});
