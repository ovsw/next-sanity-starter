import { expect, test } from "@playwright/test";

const routeGroups = [
  [
    { heading: "Neutral sample content for a clean project.", path: "/" },
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

  const faqButton = page.getByRole("button", {
    name: "What should this sample content prove?",
  });
  if (await faqButton.count()) {
    await faqButton.focus();
    await page.keyboard.press("Enter");
    await expect(faqButton).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Enter");
    await expect(faqButton).toHaveAttribute("aria-expanded", "true");
  }
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
