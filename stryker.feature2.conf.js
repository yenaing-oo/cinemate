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
            "ObjectLiteral",
            "BooleanLiteral",
            "StringLiteral",
            "EqualityOperator",
            "BlockStatement",
            "ArithmeticOperator",
        ],
    },
    mutate: [
        "src/server/api/routers/showtimeSeats.ts",
        "src/server/api/routers/bookingSession.ts",
        "src/server/api/routers/bookings.ts",
        "!src/**/*.test.ts",
        "!src/**/*.test.tsx",
    ],
    vitest: {
        configFile: "vitest.config.mts",
        related: true,
    },
    tempDirName: ".stryker-tmp-feature2",
};

export default config;
