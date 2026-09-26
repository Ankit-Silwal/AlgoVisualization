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
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  expect((await downloaded).suggestedFilename()).toBe("algovisual-benchmarks.csv");
  await page.getByRole("button", { name: "Save experiment", exact: true }).click();
  await page.getByLabel("Experiment name", { exact: true }).fill("Measured snapshot");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save experiment", exact: true })
    .click();
  await expect(page.locator(".toast")).toContainText("saved");
  await page.reload();
  await page.getByRole("button", { name: "Saved experiments", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Measured snapshot/ })
    .click();
  await expect(page.locator(".benchmark-panel tbody tr")).toHaveCount(9);
  await expect(page.getByRole("textbox", { name: "Benchmark input sizes" })).toHaveValue("10");
});
