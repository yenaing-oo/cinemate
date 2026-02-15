import { exampleRouter } from "~/server/api/routers/example";
import { emailRouter } from "~/server/api/routers/email";
import { moviesRouter } from "~/server/api/routers/movies";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
    example: exampleRouter,
    email: emailRouter,
    movies: moviesRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.example.hello({ text: "world" });
 *       ^? { greeting: string }
 */
export const createCaller = createCallerFactory(appRouter);
