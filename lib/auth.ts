import { randomBytes, createHash, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { db } from "./db";
const scrypt = promisify(scryptCallback);
const COOKIE = "algovisual_session";
export const digest = (s: string) => createHash("sha256").update(s).digest("hex");
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}
export async function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash || hash.length !== 128) return false;
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return timingSafeEqual(key, Buffer.from(hash, "hex"));
}
export function sessionToken(request: Request) {
  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}
export async function currentUser(request: Request) {
  const token = sessionToken(request);
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: digest(token) },
    include: { user: { select: { id: true, email: true } } },
  });
  return session && session.expiresAt > new Date() ? session.user : null;
}
export async function startSession(userId: string) {
  const token = randomBytes(32).toString("hex"),
    expiresAt = new Date(Date.now() + 7 * 86400e3);
  await db.session.create({ data: { tokenHash: digest(token), userId, expiresAt } });
  return { token, expiresAt };
}
export function attachSession(response: NextResponse, session: { token: string; expiresAt: Date }) {
  response.cookies.set(COOKIE, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: session.expiresAt,
  });
  return response;
}
export function clearSession(response: NextResponse) {
  response.cookies.set(COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
export async function allowRate(key: string, limit: number, windowMs: number) {
  const bucket = Math.floor(Date.now() / windowMs),
    expiresAt = new Date((bucket + 1) * windowMs);
  const rows = await db.$queryRaw<
    { count: number }[]
  >`INSERT INTO "RateLimit" ("key","count","expiresAt") VALUES (${`${key}:${bucket}`},1,${expiresAt}) ON CONFLICT ("key") DO UPDATE SET "count"="RateLimit"."count"+1 RETURNING "count"`;
  return rows[0].count <= limit;
}
export function clientAddress(request: Request) {
  return process.env.TRUST_PROXY === "true"
    ? request.headers.get("x-forwarded-for")?.split(",")[0].trim().slice(0, 80) || "unknown"
    : "local";
}
