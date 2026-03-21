import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
    /**
     * Specify your server-side environment variables schema here. This way you can ensure the app
     * isn't built with invalid env vars.
     */
    server: {
        DATABASE_URL: z.string().url(),
        DIRECT_URL: z.string().url().optional(),
        TMDB_ACCESS_TOKEN: z.string(),
        RESEND_EMAIL_API_KEY: z.string(),
        APP_BASE_URL: z.string().url(),
        CINEMA_TIMEZONE: z.string(),
        NODE_ENV: z
            .enum(["development", "test", "production"])
            .default("development"),
        BOOKING_CANCEL_WINDOW_MINUTES: z.number().int().min(0).default(60),
    },

    /**
     * Specify your client-side environment variables schema here. This way you can ensure the app
     * isn't built with invalid env vars. To expose them to the client, prefix them with
     * `NEXT_PUBLIC_`.
     */
    client: {
        NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string(),
        NEXT_PUBLIC_CINEMA_TIMEZONE: z.string(),
        NEXT_PUBLIC_BOOKING_CANCEL_WINDOW_MINUTES: z.coerce
            .number()
            .int()
            .min(0)
            .default(60),
    },

    /**
     * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
     * middlewares) or client-side so we need to destruct manually.
     */
    runtimeEnv: {
        DATABASE_URL: process.env.DATABASE_URL,
        DIRECT_URL: process.env.DIRECT_URL,
        TMDB_ACCESS_TOKEN: process.env.TMDB_ACCESS_TOKEN,
        RESEND_EMAIL_API_KEY: process.env.RESEND_EMAIL_API_KEY,
        APP_BASE_URL: process.env.APP_BASE_URL,
        CINEMA_TIMEZONE: process.env.CINEMA_TIMEZONE,
        NODE_ENV: process.env.NODE_ENV,
        BOOKING_CANCEL_WINDOW_MINUTES:
            Number(process.env.BOOKING_CANCEL_WINDOW_MINUTES),
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        NEXT_PUBLIC_CINEMA_TIMEZONE: process.env.NEXT_PUBLIC_CINEMA_TIMEZONE,
        NEXT_PUBLIC_BOOKING_CANCEL_WINDOW_MINUTES:
            Number(process.env.NEXT_PUBLIC_BOOKING_CANCEL_WINDOW_MINUTES),
    },
    /**
     * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
     * useful for Docker builds.
     */
    skipValidation: !!process.env.SKIP_ENV_VALIDATION,
    /**
     * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
     * `SOME_VAR=''` will throw an error.
     */
    emptyStringAsUndefined: true,
});
