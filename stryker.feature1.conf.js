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
        low: 100,
        break: 100,
    },
    mutator: {
        name: "typescript",
        excludedMutations: [
            "ConditionalExpression",
        ],
    },
    mutate: [
        "src/server/api/routers/movies.ts",
        "src/server/api/routers/showtimes.ts",
        "src/server/services/tmdb.ts",
        "src/lib/utils.ts",
        "!src/**/*.test.ts",
        "!src/**/*.test.tsx",
    ],
    vitest: {
        configFile: "vitest.config.mts",
        related: true,
    },
    tempDirName: ".stryker-tmp-feature1",
};

export default config;