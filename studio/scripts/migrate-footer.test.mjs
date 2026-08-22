import assert from "node:assert/strict";
import test from "node:test";
import { footerColumnsFromLegacySections, migrationPatch } from "./migrate-footer.mjs";

const link = (key, label) => ({
  _key: key,
  _type: "footerLink",
  destination: { _type: "footerDestination", external: `/${key}/`, kind: "external", openInNewTab: false },
  label,
});

const legacyFooter = () => ({
  _id: "footer",
  _rev: "legacy-revision",
  _type: "footer",
  brand: { addressLines: ["3602 E Campbell Ave"], mapLink: link("map", "Google Maps"), phone: link("phone", "602-908-5849") },
  compliance: { headline: "Important" },
  contact: { fullName: "Jimmy Vercellino" },
  resources: { heading: "Resources", links: [link("rates", "Rates"), link("about", "About")] },
  social: { heading: "Follow", links: [link("youtube", "YouTube"), link("linkedin", "LinkedIn")] },
});

test("moves the existing resources and social link objects into ordered columns", () => {
  const source = legacyFooter();
  const result = footerColumnsFromLegacySections(source);

  assert.equal(result.noOp, false);
  assert.deepEqual(result.columns, [
    { _key: "resources", _type: "footerColumn", heading: "Resources", links: source.resources.links },
    { _key: "follow", _type: "footerColumn", heading: "Follow", links: [...source.social.links, source.brand.mapLink] },
  ]);
  assert.strictEqual(result.columns[0].links[0], source.resources.links[0]);
  assert.strictEqual(result.columns[1].links[2], source.brand.mapLink);
});

test("creates a narrow set/unset patch without touching other footer fields", () => {
  const source = legacyFooter();
  assert.deepEqual(migrationPatch(source), {
    set: { columns: footerColumnsFromLegacySections(source).columns },
    unset: ["resources", "social", "brand.mapLink"],
  });
});

test("is an idempotent no-op for a fully migrated footer", () => {
  const source = legacyFooter();
  const { columns } = footerColumnsFromLegacySections(source);
  delete source.resources;
  delete source.social;
  delete source.brand.mapLink;
  source.columns = columns;

  assert.equal(footerColumnsFromLegacySections(source).noOp, true);
  assert.equal(migrationPatch(source), null);
});

test("rejects hybrid and malformed footer states", () => {
  const hybrid = legacyFooter();
  hybrid.columns = [];
  assert.throws(() => footerColumnsFromLegacySections(hybrid), /hybrid/);

  const malformed = legacyFooter();
  malformed.social.links = [];
  assert.throws(() => footerColumnsFromLegacySections(malformed), /at least one link/);

  const malformedCanonical = legacyFooter();
  delete malformedCanonical.resources;
  delete malformedCanonical.social;
  delete malformedCanonical.brand.mapLink;
  malformedCanonical.columns = [{ _key: "resources", _type: "footerColumn", heading: "Resources", links: [] }];
  assert.throws(() => footerColumnsFromLegacySections(malformedCanonical), /at least one link/);
});
