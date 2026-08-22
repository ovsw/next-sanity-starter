import { expect, test } from "@playwright/test";

const route = "/construction-to-permanent-loan/";
const viewports = [
  { height: 844, width: 390 },
  { height: 1024, width: 768 },
  { height: 1000, width: 1440 },
] as const;

test("keeps the responsive footer ready and free of local horizontal overflow", async ({ page }) => {
  await page.goto(route);

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);

    const footer = page.getByRole("contentinfo");
    await expect(footer).toHaveAttribute("data-footer-state", "ready");
    expect(await footer.evaluate((element) => element.scrollWidth - element.clientWidth)).toBe(0);
  }
});

test("keeps footer destinations correct from a nested route", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto(route);

  const footer = page.getByRole("contentinfo");
  await expect(footer.getByRole("link", { name: "Construction-to-Permanent Loan" })).toHaveAttribute(
    "href",
    "/construction-to-permanent-loan/",
  );
  await expect(footer.getByRole("link", { name: "602-908-5849" })).toHaveAttribute(
    "href",
    "tel:+16029085849",
  );
  await expect(footer.getByRole("link", { name: "jimmy.vercellino@goluminate.com" })).toHaveAttribute(
    "href",
    "mailto:jimmy.vercellino@goluminate.com",
  );
  await expect(footer.getByRole("link", { name: "YouTube" })).toHaveAttribute(
    "rel",
    "noopener noreferrer",
  );
  await expect(footer.locator('a[href="#"]')).toHaveCount(0);
  await expect(page.locator("html")).toHaveJSProperty("scrollWidth", 390);
});
