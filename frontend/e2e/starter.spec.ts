import { expect, test } from "@playwright/test";

const routes = [
  { heading: "Build your next website from a clean starting point.", path: "/" },
  { heading: "Getting Started", path: "/getting-started" },
  { heading: "Blog", path: "/blog" },
  { heading: "Welcome to Your Site", path: "/blog/welcome" },
] as const;

test("serves the neutral starter routes from Sanity", async ({ page }) => {
  for (const route of routes) {
    const response = await page.goto(route.path);

    expect(response?.ok()).toBe(true);
    await expect(
      page.getByRole("heading", { level: 1, name: route.heading }),
    ).toBeVisible();
  }
});

test("keeps the starter page free of horizontal overflow", async ({ page }) => {
  for (const viewport of [
    { height: 844, width: 390 },
    { height: 1024, width: 768 },
    { height: 1000, width: 1440 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/getting-started");

    expect(
      await page
        .locator("html")
        .evaluate((element) => element.scrollWidth - element.clientWidth),
    ).toBe(0);
  }
});
