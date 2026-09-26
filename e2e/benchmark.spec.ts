import { test, expect } from "@playwright/test";
import { signIn } from "./helpers";
test.beforeEach(async ({ page }) => {
  await signIn(page);
});
test("benchmark honors the selected method entry point", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Remove Merge sort", exact: true }).click();
  await page.getByRole("button", { name: "Remove Selection sort", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Insertion sort source code" })
    .fill(
      "function helper(){throw Error('wrong entry point');}\nfunction solve(nums){return nums;}",
    );
  await page.getByText(/Submission settings .*full program/).click();
  await page.getByLabel("Insertion sort submission mode").selectOption("function");
  await page.getByLabel("Insertion sort entry point").fill("solve");
  await page.getByLabel("Benchmark input sizes").fill("10");
  await page.getByLabel("Benchmark repetitions").selectOption("1");
  const request = page.waitForRequest((r) => r.url().endsWith("/api/run") && r.method() === "POST");
  await page.getByRole("button", { name: "Run benchmark", exact: true }).click();
  expect((await request).postDataJSON()).toMatchObject({ mode: "function", entrypoint: "solve" });
  await expect(page.locator(".benchmark-panel tbody tr")).toHaveCount(3, { timeout: 30000 });
  await expect(page.locator(".benchmark-panel tbody")).not.toContainText("ERROR");
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
