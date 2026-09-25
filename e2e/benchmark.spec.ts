import { test, expect } from "@playwright/test";
import { signIn } from "./helpers";
test.beforeEach(async ({ page }) => {
  await signIn(page);
});
test("measured benchmark renders real samples and exports", async ({ page }) => {
  test.setTimeout(60000);
  await page.goto("/");
  await page.getByRole("textbox", { name: "Benchmark input sizes" }).fill("10");
  await page.getByRole("combobox", { name: "Benchmark repetitions" }).selectOption("1");
  await page.getByRole("button", { name: "Run benchmark", exact: true }).click();
  await expect(page.locator(".benchmark-panel tbody tr")).toHaveCount(9, { timeout: 50000 });
  await expect(page.getByRole("img", { name: "Measured benchmark growth curves" })).toBeVisible();
  await expect(page.locator(".benchmark-panel")).toContainText("More samples needed");
});
