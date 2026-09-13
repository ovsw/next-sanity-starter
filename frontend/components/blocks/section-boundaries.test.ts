import { describe, expect, it } from "vitest";
import {
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
      { key: "first", theme: "light", top: "outer", bottom: "seam" },
      { key: "same", theme: "light", top: "seam", bottom: "edge" },
      { key: "different", theme: "dark", top: "edge", bottom: "edge" },
      { key: "unknown", theme: null, top: "edge", bottom: "edge" },
      { key: "hero", theme: null, top: "edge", bottom: "outer" },
    ]);
  });

  it("compares preview-encoded themes after cleaning them", () => {
    const hidden = String.fromCodePoint(8203, 8203, 8203, 8203);
    const encodedDark = `dark${hidden}`;
    expect(resolveSectionTheme(encodedDark)).toBe("dark");
    expect(
      resolveSectionBoundaries([
        { key: "one", theme: encodedDark },
        { key: "two", theme: "dark" },
      ]).map(({ top, bottom }) => [top, bottom]),
    ).toEqual([
      ["outer", "seam"],
      ["seam", "outer"],
    ]);
  });
});
