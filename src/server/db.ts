// Creates and reuses the Prisma client for server-side database access.
import { env } from "~/env.mjs";
import { PrismaClient } from "@prisma/client";

const createPrismaClient = () =>
    new PrismaClient({
        log: env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });

const globalForPrisma = globalThis as unknown as {
    prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
