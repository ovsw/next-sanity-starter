import WebsiteJsonLd from "@/components/website-json-ld";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  createWebsiteJsonLd,
  serializeWebsiteJsonLd,
} from "./website-json-ld";

describe("WebsiteJsonLd", () => {
  it("identifies the site with the public brand name", () => {
    expect(createWebsiteJsonLd("https://phxhomeloan.com/")).toEqual({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://phxhomeloan.com/#website",
      name: "PHX Home Loan",
      url: "https://phxhomeloan.com",
    });
  });

  it("escapes less-than signs when serialized", () => {
    const value = {
      ...createWebsiteJsonLd("https://phxhomeloan.com"),
      url: "https://phxhomeloan.com/<unsafe>",
    };

    expect(serializeWebsiteJsonLd(value)).not.toContain("<");
    expect(serializeWebsiteJsonLd(value)).toContain("\\u003cunsafe>");
  });

  it("renders one JSON-LD script", () => {
    const { container } = render(
      <WebsiteJsonLd siteUrl="https://phxhomeloan.com" />,
    );
    const script = container.querySelector('script[type="application/ld+json"]');

    expect(script).not.toBeNull();
    expect(JSON.parse(script?.textContent || "{}")).toEqual(
      createWebsiteJsonLd("https://phxhomeloan.com"),
    );
  });
});
