import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  allowRate,
  attachSession,
  clearSession,
  clientAddress,
  currentUser,
  digest,
  hashPassword,
  sessionToken,
  startSession,
  verifyPassword,
} from "@/lib/auth";
import { hasSameOrigin } from "@/lib/request-origin";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    return NextResponse.json(
      { user: await currentUser(request) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  }
}
export async function POST(request: Request) {
  if (!hasSameOrigin(request))
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  try {
    if (!(await allowRate(`auth-ip:${clientAddress(request)}`, 30, 600000)))
      return NextResponse.json(
        { error: "Too many attempts. Try again in ten minutes." },
        { status: 429 },
      );
    const text = await request.text();
    if (text.length > 2000)
      return NextResponse.json({ error: "Request too large." }, { status: 413 });
    const parsed = z
      .object({
        action: z.enum(["register", "login", "change-password"]),
        email: z
          .string()
          .email()
          .max(254)
          .transform((v) => v.toLowerCase().trim()),
        password: z.string().min(10).max(128),
        newPassword: z.string().min(10).max(128).optional(),
      })
      .safeParse(JSON.parse(text));
    if (!parsed.success)
      return NextResponse.json(
        { error: "Use a valid email and a password between 10 and 128 characters." },
        { status: 400 },
      );
    const { action, email, password, newPassword } = parsed.data;
    if (!(await allowRate(`auth-email:${digest(email)}`, 15, 600000)))
      return NextResponse.json(
        { error: "Too many attempts for this account. Try later." },
        { status: 429 },
      );
    if (action === "register") {
      if (process.env.REGISTRATION_ENABLED === "false")
        return NextResponse.json({ error: "New registrations are disabled." }, { status: 403 });
      const exists = await db.user.findUnique({ where: { email }, select: { id: true } });
      if (exists)
        return NextResponse.json(
          { error: "Unable to create this account. Try signing in." },
          { status: 409 },
        );
      const user = await db.user.create({
        data: { email, passwordHash: await hashPassword(password) },
        select: { id: true, email: true },
      });
      return attachSession(
        NextResponse.json({ user }, { status: 201 }),
        await startSession(user.id),
      );
    }
    const user = await db.user.findUnique({ where: { email } });
    const valid = await verifyPassword(
      password,
      user?.passwordHash || `${"0".repeat(32)}:${"0".repeat(128)}`,
    );
    if (!user || !valid)
      return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    if (action === "change-password") {
      const signedIn = await currentUser(request);
      if (!signedIn || signedIn.id !== user.id || !newPassword)
        return NextResponse.json(
          { error: "Sign in and provide your current and new passwords." },
          { status: 401 },
        );
      await db.$transaction([
        db.user.update({
          where: { id: user.id },
          data: { passwordHash: await hashPassword(newPassword) },
        }),
        db.session.deleteMany({ where: { userId: user.id } }),
      ]);
    }
    return attachSession(
      NextResponse.json({ user: { id: user.id, email: user.email } }),
      await startSession(user.id),
    );
  } catch {
    return NextResponse.json(
      { error: "Could not complete authentication. Check database connectivity and try again." },
      { status: 503 },
    );
  }
}
export async function DELETE(request: Request) {
  if (!hasSameOrigin(request))
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  try {
    const token = sessionToken(request);
    if (token) await db.session.deleteMany({ where: { tokenHash: digest(token) } });
    return clearSession(NextResponse.json({ ok: true }));
  } catch {
    return NextResponse.json(
      { error: "Could not revoke the session. Try again." },
      { status: 503 },
    );
  }
}
