import { beforeEach, describe, expect, it, vi } from "vitest";

const defineEnableDraftMode = vi.hoisted(() => vi.fn());
const withConfig = vi.hoisted(() => vi.fn(() => ({ configured: true })));
const tokenState = vi.hoisted(() => ({ value: undefined as string | undefined }));

vi.mock("next-sanity/draft-mode", () => ({ defineEnableDraftMode }));
vi.mock("@/sanity/lib/client", () => ({ client: { withConfig } }));
vi.mock("@/sanity/lib/token", () => ({
  get token() {
    return tokenState.value;
  },
}));

async function loadRoute() {
  vi.resetModules();
  return import("./route");
}

describe("draft mode enable route", () => {
  beforeEach(() => {
    defineEnableDraftMode.mockReset();
    withConfig.mockClear();
    tokenState.value = undefined;
  });

  it("returns a clear configuration error when the Sanity read token is missing", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { GET } = await loadRoute();

    const response = await GET(
      new Request("http://localhost:3000/api/draft-mode/enable"),
    );

    await expect(response.text()).resolves.toContain("Missing SANITY_API_READ_TOKEN");
    expect(response.status).toBe(500);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Missing SANITY_API_READ_TOKEN"),
    );
    expect(defineEnableDraftMode).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it.each(["iframe", "document", undefined])(
    "forwards the preview request without the iframe signal (%s)",
    async (destination) => {
      const result = new Response(null, {
        status: 307,
        headers: { location: "/preview" },
      });
      const handler = vi.fn((request: Request) => {
        void request;
        return result;
      });
      defineEnableDraftMode.mockReturnValue({ GET: handler });
      tokenState.value = "read-token";

      const { GET } = await loadRoute();
      const headers = new Headers({
        "sec-fetch-site": "cross-site",
        cookie: "example=value",
      });
      if (destination) headers.set("sec-fetch-dest", destination);
      const request = new Request(
        "https://example.com/api/draft-mode/enable?sanity-preview-secret=abc&sanity-preview-pathname=%2Fpreview",
        { headers },
      );
      const response = await GET(request);

      expect(withConfig).toHaveBeenCalledWith({ token: "read-token" });
      expect(defineEnableDraftMode).toHaveBeenCalledWith({
        client: { configured: true },
      });
      expect(response).toBe(result);
      expect(handler).toHaveBeenCalledTimes(1);
      const forwarded = handler.mock.calls[0][0];
      expect(forwarded.url).toBe(request.url);
      expect(forwarded.headers.get("sec-fetch-dest")).toBeNull();
      expect(forwarded.headers.get("sec-fetch-site")).toBe("cross-site");
      expect(forwarded.headers.get("cookie")).toBe("example=value");
      expect(request.headers.get("sec-fetch-dest")).toBe(destination ?? null);
    },
  );
});
