import { test, expect } from "@playwright/test";
test("range queries, tree search and trie operations are interactive", async ({ page }) => {
  await page.goto("/");
  const studio = page.locator(".structure-studio");
  await page.getByRole("combobox", { name: "Explore data structure" }).selectOption("Fenwick tree");
  await page.getByRole("textbox", { name: "Operation arguments" }).fill("2");
  await studio.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(studio.getByRole("status")).toContainText("= 21");
  await page
    .getByRole("combobox", { name: "Explore data structure" })
    .selectOption("Binary search tree");
  await page.getByRole("combobox", { name: "Structure operation" }).selectOption("Find");
  await page.getByRole("textbox", { name: "Operation arguments" }).fill("6");
  await studio.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(studio.getByRole("status")).toContainText("3 comparisons");
  await page.getByRole("combobox", { name: "Explore data structure" }).selectOption("Trie");
  await page.getByRole("textbox", { name: "Operation arguments" }).fill("cap");
  await studio.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(studio.getByRole("status")).toContainText("Inserted");
  await page.getByRole("combobox", { name: "Structure operation" }).selectOption("Find word");
  await studio.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(studio.getByRole("status")).toContainText("Found");
  await expect(page.getByRole("img", { name: "Trie visualization" })).toBeVisible();
  await studio.screenshot({ path: "test-results/structure-studio.png" });
});
