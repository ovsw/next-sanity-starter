// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createOgImageResponse } from "./og-image-response";

describe("sharing card PNG output", () => {
  it.each([
    undefined,
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jL1sAAAAASUVORK5CYII=",
  ])("renders brand assets with photo %s", async (photoUrl) => {
    const response = await createOgImageResponse({
      title: "A useful title",
      eyebrow: "Your site",
      photoUrl,
    });
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(response.headers.get("content-type")).toBe("image/png");
    expect([...bytes.slice(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  });
});
