import { expect, test } from "@playwright/test";

const routeGroups = [
  [
    { heading: "Starter Example", path: "/" },
    { heading: "Starter Home", path: "/" },
  ],
  [
    { heading: "About", path: "/about" },
    { heading: "Getting Started", path: "/getting-started" },
  ],
  [{ heading: "Blog", path: "/blog" }],
  [
    { heading: "Starter Field Guide", path: "/blog/starter-field-guide" },
    { heading: "Welcome to Your Site", path: "/blog/welcome" },
  ],
] as const;

const pageRoutes = routeGroups[1];

async function gotoAvailableRoute(
  page: import("@playwright/test").Page,
  candidates: (typeof routeGroups)[number],
) {
  for (const candidate of candidates) {
    const response = await page.goto(candidate.path);
    const heading = page.getByRole("heading", {
      level: 1,
      name: candidate.heading,
    });
    if (response?.ok() && (await heading.isVisible())) return candidate;
  }

  throw new Error(
    `None of the expected Starter routes responded: ${candidates.map(({ path }) => path).join(", ")}`,
  );
}

async function expectAccessibleRoute(page: import("@playwright/test").Page) {
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /theme|color mode|dark|light/i }),
  ).toHaveCount(0);
  await expect(
    page.locator("[aria-hidden='false'], [aria-hidden='true'][tabindex='0']"),
  ).toHaveCount(0);
}

test("serves the neutral starter routes from Sanity", async ({ page }) => {
  for (const candidates of routeGroups) {
    const route = await gotoAvailableRoute(page, candidates);

    await expect(
      page.getByRole("heading", { level: 1, name: route.heading }),
    ).toBeVisible();
    await expectAccessibleRoute(page);
  }
});

test("supports keyboard access on starter routes", async ({ page }) => {
  await page.goto("/");

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);

  await page.goto("/");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: /home page/i }).first()).toBeFocused();

});

test("keeps reduced-motion visitors out of starter animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const runningAnimations = await page
    .locator("body *")
    .evaluateAll((elements) =>
      elements.filter((element) => {
        const style = getComputedStyle(element);
        return (
          style.animationName !== "none" ||
          style.transitionDuration !== "0s"
        );
      }).length,
    );

  expect(runningAnimations).toBe(0);
});

test("keeps the starter page free of horizontal overflow", async ({ page }) => {
  for (const viewport of [
    { height: 844, width: 390 },
    { height: 1024, width: 768 },
    { height: 1000, width: 1440 },
  ]) {
    await page.setViewportSize(viewport);
    await gotoAvailableRoute(page, pageRoutes);

    expect(
      await page
        .locator("html")
        .evaluate((element) => element.scrollWidth - element.clientWidth),
    ).toBe(0);
  }
});

test("homepage sections join with seams and edges", async ({ page }) => {
  await page.goto("/");
  const homepage = page.getByRole("heading", {
    level: 2,
    name: "Neutral sample content for a clean project.",
  });
  test.skip(!(await homepage.isVisible()), "Starter homepage sample content is not seeded");

  const sections = await page.locator("main section.section-scene").evaluateAll(
    (elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          top: rect.top + window.scrollY,
          bottom: rect.bottom + window.scrollY,
          paddingTop: parseFloat(style.paddingTop),
          paddingBottom: parseFloat(style.paddingBottom),
          background: style.backgroundColor,
          scaffold: element.hasAttribute("data-scaffold"),
        };
      }),
  );
  expect(sections.length).toBeGreaterThanOrEqual(4);

  const joins = sections.slice(1).map((lower, index) => {
    const upper = sections[index];
    return { upper, lower, match: upper.background === lower.background };
  });
  const seam = joins.find((join) => join.match && !join.lower.scaffold);
  const edge = joins.find((join) => !join.match && !join.lower.scaffold);

  // Seam: both sides contribute half padding. Edge: full padding on both sides.
  expect(seam).toBeDefined();
  expect(edge).toBeDefined();
  expect(seam!.upper.paddingBottom).toBeLessThan(edge!.upper.paddingBottom);
  expect(seam!.lower.paddingTop).toBeLessThan(edge!.lower.paddingTop);
  expect(seam!.lower.top).toBeCloseTo(seam!.upper.bottom, 0);
  expect(edge!.lower.top).toBeCloseTo(edge!.upper.bottom, 0);

  // Seam-joined sections share one band; a themeless Scaffold never joins one.
  const bands = await page.locator("main [data-band]").evaluateAll((elements) =>
    elements.map((element) => ({
      theme: element.getAttribute("data-band"),
      sections: element.querySelectorAll("section.section-scene").length,
      scaffolds: element.querySelectorAll("section[data-scaffold]").length,
    })),
  );
  expect(bands.some((band) => band.sections > 1)).toBe(true);
  for (const band of bands) {
    if (band.scaffolds) expect(band.sections).toBe(band.scaffolds);
  }
});

test("a Scaffold renders its marker on the page and nothing from the archive", async ({
  page,
}) => {
  await page.goto("/");
  const scaffold = page.locator("section[data-scaffold]");
  test.skip(!(await scaffold.count()), "Starter homepage sample content is not seeded");

  await expect(scaffold).toHaveCount(1);
  await expect(scaffold).toContainText("Scaffold:");
  await expect(scaffold).toContainText("Reader quotes");
  await expect(scaffold).toContainText("Proposed shape:");

  await page.goto("/about");
  await expect(page.locator("section[data-scaffold]")).toHaveCount(0);
  await expect(page.getByText("About page intro")).toHaveCount(0);
});
