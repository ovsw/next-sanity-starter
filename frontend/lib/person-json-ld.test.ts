import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import PersonJsonLd from "@/components/person-json-ld";
import {
  createPersonJsonLd,
  serializePersonJsonLd,
} from "./person-json-ld";

describe("createPersonJsonLd", () => {
  it("builds Jimmy Vercellino's Person entity", () => {
    expect(createPersonJsonLd("https://phxhomeloan.com")).toEqual({
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": "https://phxhomeloan.com/#jimmy",
      name: "Jimmy Vercellino",
      jobTitle: "Mortgage Loan Originator",
      description:
        "Mortgage Loan Originator (NMLS #184169) at Luminate Bank. U.S. Marine Corps veteran, Operation Iraqi Freedom.",
      identifier: {
        "@type": "PropertyValue",
        propertyID: "NMLS",
        value: "184169",
      },
      worksFor: {
        "@type": "Organization",
        name: "Luminate Bank",
      },
      url: "https://phxhomeloan.com",
      image: "https://phxhomeloan.com/images/jimmy-vercellino.jpg",
      sameAs: [
        "https://www.youtube.com/@JimmyVercellino",
        "https://www.linkedin.com/in/jimmy-vercellino-29060930/",
        "https://www.facebook.com/TheVercellinoTeam",
        "https://www.instagram.com/jimmyvercellino_/",
        "https://twitter.com/phxhomeloan",
        "https://www.valoansforvets.com/",
      ],
    });
  });

  it("normalizes a trailing slash", () => {
    expect(createPersonJsonLd("https://x.com/")).toEqual(
      createPersonJsonLd("https://x.com"),
    );
  });

  it("uses a stable fragment identifier", () => {
    expect(createPersonJsonLd("https://x.com")["@id"]).toMatch(/\/#jimmy$/);
  });

  it("neutralizes script-closing payloads when serialized", () => {
    const value = {
      ...createPersonJsonLd("https://x.com"),
      description: "</script><script>alert(1)</script>",
    };

    const serialized = serializePersonJsonLd(value);
    expect(serialized).not.toContain("<");
    expect(serialized).toContain("\\u003c/script>");
    expect(JSON.parse(serialized)).toEqual(value);
  });
});

describe("PersonJsonLd", () => {
  it("renders one parseable JSON-LD script", () => {
    const html = renderToStaticMarkup(
      PersonJsonLd({ siteUrl: "https://phxhomeloan.com" }),
    );
    const scripts = [
      ...html.matchAll(
        /<script type="application\/ld\+json">(.*?)<\/script>/g,
      ),
    ];

    expect(scripts).toHaveLength(1);
    expect(JSON.parse(scripts[0]?.[1] ?? "")).toEqual(
      createPersonJsonLd("https://phxhomeloan.com"),
    );
  });
});
