import { describe, expect, it } from "vitest";
import { createHeaderNavigationModel } from "./model";

const testSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 22h18"></path></svg>';

describe("createHeaderNavigationModel", () => {
  it("maps direct links, rich groups, actions, and normalized destinations", () => {
    const model = createHeaderNavigationModel({
      _id: "navigation",
      items: [
        {
          _key: "contact",
          kind: "link",
          label: "Contact",
          destination: { href: "contact", openInNewTab: false },
        },
        {
          _key: "loans",
          kind: "group",
          label: "Loan Types",
          links: [
            {
              _key: "va",
              label: "VA Loan",
              description: "Benefits for eligible service members.",
              icon: { name: "shield-check", svg: testSvg },
              destination: { href: "/phoenix-va-loan", openInNewTab: false },
            },
          ],
        },
      ],
      actions: [
        {
          _key: "schedule",
          label: "Schedule Consult",
          destination: {
            href: "https://example.com/book",
            openInNewTab: true,
          },
        },
      ],
    });

    expect(model).toEqual({
      items: [
        {
          key: "contact",
          kind: "link",
          label: "Contact",
          link: { href: "/contact", label: "Contact", openInNewTab: false },
        },
        {
          key: "loans",
          kind: "group",
          label: "Loan Types",
          links: [
            {
              key: "va",
              label: "VA Loan",
              description: "Benefits for eligible service members.",
              icon: { name: "shield-check", svg: testSvg },
              link: {
                href: "/phoenix-va-loan",
                label: "VA Loan",
                openInNewTab: false,
              },
            },
          ],
        },
      ],
      actions: [
        {
          key: "schedule",
          link: {
            href: "https://example.com/book",
            label: "Schedule Consult",
            openInNewTab: true,
          },
        },
      ],
    });
  });

  it("omits invalid destinations and structurally empty groups", () => {
    const model = createHeaderNavigationModel({
      _id: "navigation",
      items: [
        {
          _key: "broken",
          kind: "link",
          label: "Broken",
          destination: { href: "#", openInNewTab: false },
        },
        {
          _key: "empty",
          kind: "group",
          label: "Empty",
          links: [],
        },
      ],
      actions: [],
    });

    expect(model).toEqual({ items: [], actions: [] });
  });
});
