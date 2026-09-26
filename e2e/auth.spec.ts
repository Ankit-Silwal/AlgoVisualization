import { test, expect } from "@playwright/test";
import { signIn } from "./helpers";
test("accounts isolate experiments and queued execution", async ({ page, browser }) => {
  test.setTimeout(60000);
  expect((await page.request.get("/api/experiments")).status()).toBe(401);
  expect(
    (
      await page.request.post("/api/run", {
        data: { language: "Python", code: "print(1)", stdin: "", timeout: 1 },
      })
    ).status(),
  ).toBe(401);
  const email = await signIn(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Save experiment", exact: true }).click();
  await page.getByLabel("Experiment name", { exact: true }).fill("Private test");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save experiment", exact: true })
    .click();
  await expect(page.locator(".toast")).toContainText("saved");
  const list = await (await page.request.get("/api/experiments")).json();
  expect(list).toHaveLength(1);
  const queued = await page.request.post("/api/run", {
    data: { language: "Python", code: "print(42)", stdin: "", timeout: 2, repetitions: 3 },
  });
  expect(queued.status()).toBe(202);
  const { id } = await queued.json();
  const second = await browser.newContext({ baseURL: "http://localhost:3000" });
  const other = await second.newPage();
  await signIn(other);
  expect(await (await other.request.get("/api/experiments")).json()).toEqual([]);
  expect((await other.request.delete(`/api/experiments/${list[0].id}`)).status()).toBe(404);
  expect((await other.request.get(`/api/jobs/${id}`)).status()).toBe(404);
  await expect
    .poll(async () => (await (await page.request.get(`/api/jobs/${id}`)).json()).status, {
      timeout: 30000,
    })
    .toBe("SUCCEEDED");
  const result = (await (await page.request.get(`/api/jobs/${id}`)).json()).result;
  expect(result.stdout.trim()).toBe("42");
  expect(result.samplesMs).toHaveLength(3);
  const longJob = await page.request.post("/api/run", {
    data: { language: "Python", code: "while True: pass", stdin: "", timeout: 5 },
  });
  expect(longJob.status()).toBe(202);
  const longId = (await longJob.json()).id;
  await expect
    .poll(async () => (await (await page.request.get(`/api/jobs/${longId}`)).json()).status)
    .toBe("RUNNING");
  expect((await other.request.delete(`/api/jobs/${longId}`)).status()).toBe(404);
  expect((await page.request.delete(`/api/jobs/${longId}`)).ok()).toBeTruthy();
  await expect
    .poll(async () => (await (await page.request.get(`/api/jobs/${longId}`)).json()).status)
    .toBe("CANCELLED");
  const otherSession = await browser.newContext({ baseURL: "http://localhost:3000" });
  expect(
    (
      await otherSession.request.post("/api/auth", {
        data: { action: "login", email, password: "local-test-password-928!" },
      })
    ).ok(),
  ).toBeTruthy();
  expect(
    (
      await page.request.post("/api/auth", {
        data: {
          action: "change-password",
          email,
          password: "local-test-password-928!",
          newPassword: "replacement-password-928!",
        },
      })
    ).ok(),
  ).toBeTruthy();
  expect((await otherSession.request.get("/api/experiments")).status()).toBe(401);
  await otherSession.close();
  const wrong = await page.request.post("/api/auth", {
    data: { action: "login", email, password: "a-wrong-password" },
  });
  expect(wrong.status()).toBe(401);
  expect((await page.request.delete("/api/auth")).ok()).toBeTruthy();
  expect((await page.request.get("/api/experiments")).status()).toBe(401);
  await second.close();
});
