import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

describe("newsletter route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("stays available when Resend is not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("RESEND_AUDIENCE_ID", "");

    const response = await POST(
      new Request("http://localhost/api/newsletter", {
        method: "POST",
        body: JSON.stringify({ email: "reader@example.com" }),
      }),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Newsletter is not configured",
    });
  });
});
