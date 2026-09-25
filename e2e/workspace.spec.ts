import { test, expect } from "@playwright/test";
import { signIn } from "./helpers";
test.beforeEach(async ({ page }) => {
  await signIn(page);
});
test("comparison responds to cases, input and model edits", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "See beyond Big O." })).toBeVisible();
  await expect(page.getByRole("img", { name: /Estimated runtime graph/ })).toBeVisible();
  await page.getByRole("button", { name: "Worst case", exact: true }).click();
  await page.getByRole("spinbutton", { name: "Input size", exact: true }).fill("1000000000");
  await expect(page.getByText("3 estimated TLE", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Best case", exact: true }).click();
  await expect(page.getByRole("img", { name: /best cases/ })).toBeVisible();
  await page.getByRole("spinbutton", { name: "Input size", exact: true }).fill("20");
  await page.getByRole("button", { name: "All cases", exact: true }).click();
  await expect(page.getByText("All within the limit", { exact: true })).toBeVisible();
  await page
    .getByRole("combobox", { name: "Worst case complexity", exact: true })
    .selectOption("linear");
  await expect(
    page.getByRole("combobox", { name: "Worst case complexity", exact: true }),
  ).toHaveValue("linear");
  await page.screenshot({ path: "test-results/workspace-desktop.png", fullPage: true });
});
test("adds Python algorithms and accepts custom code", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Browse library/ }).click();
  await page.getByRole("combobox", { name: "Library language" }).selectOption("Python");
  await page
    .locator(".library-card")
    .filter({ has: page.getByRole("heading", { name: "Linear search", exact: true }) })
    .getByRole("button", { name: "Add to comparison" })
    .click();
  await expect(page.getByRole("textbox", { name: "Linear search source code" })).toContainText(
    "import sys",
  );
  await page.getByRole("button", { name: /Add algorithm/ }).click();
  await page.getByPlaceholder("e.g. My optimized sort").fill("Custom sum");
  await page.locator(".custom-code").fill("print(sum(map(int, input().split())))");
  await page.getByRole("dialog").getByRole("button", { name: "Analyze code", exact: true }).click();
  await expect(page.getByText("Suggested model — please review", { exact: true })).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add to comparison", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Custom sum", exact: true })).toBeVisible();
});
test("runs actual shared input cases through the HTTP runner", async ({ page }) => {
  test.setTimeout(60000);
  await page.goto("/");
  await page.getByRole("button", { name: "Run 3 cases", exact: true }).click();
  await expect(page.locator(".run-results .status-pill")).toHaveCount(9, { timeout: 50000 });
  await expect(page.locator(".run-results .status-pill.pass")).toHaveCount(9);
  await expect(page.locator(".run-results")).toContainText("1 2 3 4 5 6");
});
test("PostgreSQL save/load and test case editing", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Save experiment", exact: true }).click();
  await page.getByLabel("Experiment name", { exact: true }).fill("Browser verification");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save experiment", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("saved to PostgreSQL");
  await page.getByRole("button", { name: "Saved experiments", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Browser verification/ })
    .first()
    .click();
  await expect(page.getByRole("status")).toContainText("Experiment loaded");
  await page.getByRole("button", { name: "Add test case", exact: true }).click();
  await page.getByRole("textbox", { name: "Standard input", exact: true }).fill("3\n3 1 2");
  await page.getByRole("textbox", { name: "Expected output", exact: true }).fill("1 2 3");
  await expect(page.getByRole("button", { name: "Run 4 cases", exact: true })).toBeVisible();
});
test("mobile remains usable without page overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "See beyond Big O." })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBeTruthy();
  await page.getByRole("button", { name: /Data structures/ }).click();
  await expect(page.getByRole("heading", { name: "Linked list", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.screenshot({ path: "test-results/workspace-mobile.png", fullPage: true });
});
