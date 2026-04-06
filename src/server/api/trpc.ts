/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { createClient } from "~/lib/supabase/server";
import { db } from "~/server/db";

const LOAD_TEST_USER_EMAIL_HEADER = "x-load-test-user-email";
const LOAD_TEST_SECRET_HEADER = "x-load-test-secret";
const LOAD_TEST_MODE = process.env.LOAD_TEST_MODE === "true";
const LOAD_TEST_SECRET = process.env.LOAD_TEST_SECRET?.trim();
const LOAD_TEST_RUNTIME_FLAG_KEY = "load_test_auth_enabled";
const LOAD_TEST_RUNTIME_FLAG_CACHE_TTL_MS = 10_000;
type LoadTestUser = Awaited<ReturnType<typeof db.user.findUnique>>;
const loadTestUserCache = new Map<string, LoadTestUser>();
let loadTestRuntimeFlagCache:
    | {
          enabled: boolean;
          expiresAtMs: number;
      }
    | undefined;

async function findLoadTestUserByEmail(email: string) {
    const cacheKey = `email:${email}`;
    const cachedUser = loadTestUserCache.get(cacheKey);

    if (cachedUser) {
        return cachedUser;
    }

    const user = await db.user.findUnique({
        where: { email },
    });

    if (user) {
        loadTestUserCache.set(cacheKey, user);

        if (user.supabaseId) {
            loadTestUserCache.set(`supabase:${user.supabaseId}`, user);
        }
    }

    return user;
}

function hasValidLoadTestSecret(headers: Headers) {
    const requestedSecret = headers.get(LOAD_TEST_SECRET_HEADER)?.trim();

    return Boolean(
        LOAD_TEST_SECRET && requestedSecret && requestedSecret === LOAD_TEST_SECRET
    );
}

async function isLoadTestRuntimeFlagEnabled() {
    const nowMs = Date.now();

    if (
        loadTestRuntimeFlagCache &&
        loadTestRuntimeFlagCache.expiresAtMs > nowMs
    ) {
        return loadTestRuntimeFlagCache.enabled;
    }

    const runtimeFlag = await db.appRuntimeFlag.findUnique({
        where: {
            key: LOAD_TEST_RUNTIME_FLAG_KEY,
        },
        select: {
            enabled: true,
        },
    });

    const enabled = runtimeFlag?.enabled === true;
    loadTestRuntimeFlagCache = {
        enabled,
        expiresAtMs: nowMs + LOAD_TEST_RUNTIME_FLAG_CACHE_TTL_MS,
    };

    return enabled;
}

async function getLoadTestContextMode(headers: Headers) {
    if (LOAD_TEST_MODE) {
        return "local";
    }

    if (!hasValidLoadTestSecret(headers)) {
        return "disabled";
    }

    return (await isLoadTestRuntimeFlagEnabled()) ? "runtime" : "disabled";
}

async function getLoadTestContext(
    headers: Headers,
    options: { allowDefaultUserEmail?: boolean } = {}
) {
    const requestedEmail =
        headers.get(LOAD_TEST_USER_EMAIL_HEADER)?.trim() ||
        (options.allowDefaultUserEmail
            ? process.env.LOAD_TEST_DEFAULT_USER_EMAIL || "user@example.com"
            : null);

    if (!requestedEmail) {
        return {
            supabaseUser: null,
            user: null,
        };
    }

    const user = await findLoadTestUserByEmail(requestedEmail);

    if (!user) {
        return {
            supabaseUser: null,
            user: null,
        };
    }

    return {
        supabaseUser: {
            id: user.supabaseId ?? user.id,
            email: user.email,
        },
        user,
    };
}

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */

export const createTRPCContext = async (opts: { headers: Headers }) => {
    const loadTestContextMode = await getLoadTestContextMode(opts.headers);

    if (loadTestContextMode !== "disabled") {
        const loadTestContext = await getLoadTestContext(opts.headers, {
            allowDefaultUserEmail: loadTestContextMode === "local",
        });

        return {
            db,
            ...loadTestContext,
            ...opts,
        };
    }

    const supabase = await createClient();
    const {
        data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    let user = null;
    if (supabaseUser) {
        user = await db.user.findUnique({
            where: { supabaseId: supabaseUser.id },
        });
    }

    return {
        db,
        supabaseUser, // raw supabase user if needed
        user, // your custom user object
        ...opts,
    };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
        return {
            ...shape,
            data: {
                ...shape.data,
                zodError:
                    error.cause instanceof ZodError
                        ? error.cause.flatten()
                        : null,
            },
        };
    },
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
    const start = Date.now();

    if (t._config.isDev && !LOAD_TEST_MODE) {
        // artificial delay in dev
        const waitMs = Math.floor(Math.random() * 400) + 100;
        await new Promise((resolve) => setTimeout(resolve, waitMs));
    }

    const result = await next();

    const end = Date.now();
    console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

    return result;
});

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * that the user is authenticated and throws an error if not.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure
    .use(timingMiddleware)
    .use(({ ctx, next }) => {
        if (!ctx.user) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        return next({
            ctx: {
                ...ctx,
                user: ctx.user,
            },
        });
    });
