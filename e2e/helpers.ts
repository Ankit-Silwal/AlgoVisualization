import type { Page } from "@playwright/test";
export async function signIn(page: Page) {
  const email = `e2e-${crypto.randomUUID()}@example.test`;
  const r = await page.request.post("/api/auth", {
    data: { action: "register", email, password: "local-test-password-928!" },
  });
  if (!r.ok()) throw new Error(await r.text());
  return email;
}
