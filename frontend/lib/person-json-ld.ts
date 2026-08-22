export type PersonJsonLd = {
  "@context": "https://schema.org";
  "@type": "Person";
  "@id": string;
  name: string;
  jobTitle: string;
  description: string;
  identifier: {
    "@type": "PropertyValue";
    propertyID: string;
    value: string;
  };
  worksFor: {
    "@type": "Organization";
    name: string;
  };
  url: string;
  image: string;
  sameAs: string[];
};

export function createPersonJsonLd(siteUrl: string): PersonJsonLd {
  const normalizedSiteUrl = siteUrl.replace(/\/$/, "");

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${normalizedSiteUrl}/#jimmy`,
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
    url: normalizedSiteUrl,
    image: `${normalizedSiteUrl}/images/jimmy-vercellino.jpg`,
    sameAs: [
      "https://www.youtube.com/@JimmyVercellino",
      "https://www.linkedin.com/in/jimmy-vercellino-29060930/",
      "https://www.facebook.com/TheVercellinoTeam",
      "https://www.instagram.com/jimmyvercellino_/",
      "https://twitter.com/phxhomeloan",
      "https://www.valoansforvets.com/",
    ],
  };
}

export function serializePersonJsonLd(value: PersonJsonLd) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
