import { submitContactForm } from "@/app/actions/submit-contact-form";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("next/navigation", () => ({ redirect: redirectMock }));

function validFormData() {
  const formData = new FormData();
  formData.set("email", "ovi@example.com");
  formData.set("message", "I would like to talk about a home loan.");
  formData.set("name", "Ovi");
  formData.set("phone", "480-555-0100");
  return formData;
}

const initialContactFormState = { error: null };

describe("submitContactForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("submits valid form data to Formspark and redirects", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      submitContactForm(initialContactFormState, validFormData()),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://submit-form.com/a0or7TBtU",
      expect.objectContaining({
        body: JSON.stringify({
          email: "ovi@example.com",
          message: "I would like to talk about a home loan.",
          name: "Ovi",
          phone: "480-555-0100",
        }),
        method: "POST",
      }),
    );
    expect(redirectMock).toHaveBeenCalledWith("/contact/thanks/");
  });

  it("rejects invalid form data before contacting Formspark", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await submitContactForm(
      initialContactFormState,
      new FormData(),
    );

    expect(result.error).toBe("Please check the form and try again.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports a Formspark delivery failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 500 })),
    );

    const result = await submitContactForm(
      initialContactFormState,
      validFormData(),
    );

    expect(result.error).toBe(
      "Your message could not be sent. Please try again.",
    );
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("aborts a stalled Formspark request", async () => {
    const timeoutError = new DOMException("Timed out", "TimeoutError");
    const timeoutSignal = AbortSignal.abort(timeoutError);
    const timeoutSpy = vi
      .spyOn(AbortSignal, "timeout")
      .mockReturnValue(timeoutSignal);
    const fetchMock = vi
      .fn()
      .mockRejectedValue(timeoutSignal.reason);
    vi.stubGlobal("fetch", fetchMock);

    const result = await submitContactForm(
      initialContactFormState,
      validFormData(),
    );

    expect(timeoutSpy).toHaveBeenCalledWith(10_000);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://submit-form.com/a0or7TBtU",
      expect.objectContaining({ signal: timeoutSignal }),
    );
    expect(result.error).toBe(
      "Your message could not be sent. Please try again.",
    );
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
