import assert from "node:assert/strict";
import test from "node:test";
import { transformLegacyNavbar } from "./migrate-navigation.mjs";

test("transforms the legacy navbar into the canonical navigation model", () => {
  const result = transformLegacyNavbar({
    _id: "navbar",
    _type: "navbar",
    columns: [
      {
        _key: "loans",
        _type: "navbarColumn",
        title: "Loan Types",
        links: [
          {
            _key: "va",
            _type: "navbarColumnLink",
            name: "VA Loan",
            description: "Benefits for eligible service members.",
            icon: "shield-check",
            url: {
              _type: "customUrl",
              type: "internal",
              internal: { _type: "reference", _ref: "vaLoan" },
              openInNewTab: false,
            },
          },
        ],
      },
      {
        _key: "contact",
        _type: "navbarLink",
        name: "Contact",
        url: { _type: "customUrl", type: "external", external: "/contact/" },
      },
    ],
    buttons: [
      {
        _key: "schedule",
        _type: "button",
        text: "Schedule Consult",
        url: {
          _type: "customUrl",
          type: "external",
          external: "https://example.com/book",
          openInNewTab: true,
        },
      },
    ],
  });

  assert.deepEqual(result, {
    _id: "navigation",
    _type: "navigation",
    items: [
      {
        _key: "loans",
        _type: "navigationGroup",
        label: "Loan Types",
        links: [
          {
            _key: "va",
            _type: "navigationChildLink",
            label: "VA Loan",
            description: "Benefits for eligible service members.",
            icon: "shield-check",
            destination: {
              _type: "navigationDestination",
              kind: "internal",
              internal: { _type: "reference", _ref: "vaLoan" },
              openInNewTab: false,
            },
          },
        ],
      },
      {
        _key: "contact",
        _type: "navigationLink",
        label: "Contact",
        destination: {
          _type: "navigationDestination",
          kind: "external",
          external: "/contact/",
          openInNewTab: false,
        },
      },
    ],
    actions: [
      {
        _key: "schedule",
        _type: "navigationAction",
        label: "Schedule Consult",
        destination: {
          _type: "navigationDestination",
          kind: "external",
          external: "https://example.com/book",
          openInNewTab: true,
        },
      },
    ],
  });
});

test("rejects incomplete legacy navigation entries", () => {
  assert.throws(
    () =>
      transformLegacyNavbar({
        _id: "navbar",
        _type: "navbar",
        columns: [
          {
            _key: "broken",
            _type: "navbarLink",
            name: "Broken",
            url: { _type: "customUrl", type: "external" },
          },
        ],
        buttons: [],
      }),
    /missing a destination/,
  );
});
