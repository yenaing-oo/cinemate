// @ts-check

const config = {
    packageManager: "pnpm",
    plugins: ["@stryker-mutator/vitest-runner"],
    testRunner: "vitest",
    coverageAnalysis: "perTest",
    reporters: ["clear-text", "progress", "html", "json"],
    ignoreStatic: true,
    thresholds: {
        high: 100,
        low: 99.99,
        break: null,
    },
    mutate: [
        "src/app/page.tsx",
        "src/app/bookings/**/*.{ts,tsx}",
        "src/app/movies/**/*.{ts,tsx}",
        "src/app/ticketing/**/*.{ts,tsx}",
        "src/lib/utils.ts",
        "src/server/api/routers/**/*.ts",
        "src/server/services/**/*.ts",
        "src/server/utils.ts",
        "!src/**/*.test.ts",
        "!src/**/*.test.tsx",
    ],
    vitest: {
        configFile: "vitest.config.mts",
        related: true,
    },
    tempDirName: ".stryker-tmp",
};

export default config;
