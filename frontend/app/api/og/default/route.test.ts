// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("node:fs/promises", async (importOriginal) => ({
  ...(await importOriginal<typeof import("node:fs/promises")>()),
  readFile: vi.fn(async () => {
    throw new Error("missing brand file");
  }),
}));

import { GET } from "./route";

describe("default sharing card", () => {
  it("still returns a PNG when the brand files are missing", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await GET();
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("cache-control")).toBe("public, max-age=300");
    expect([...bytes.slice(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(error).toHaveBeenCalledWith(
      "Default OG image generation failed",
      expect.any(Error),
    );
  });
});
