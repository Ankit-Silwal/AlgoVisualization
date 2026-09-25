import { PrismaClient } from "@prisma/client";
const globalDb = globalThis as unknown as { algoPrisma?: PrismaClient };
export const db = globalDb.algoPrisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalDb.algoPrisma = db;
