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
            "ObjectLiteral",
            "BlockStatement",
            "StringLiteral",
            "ConditionalExpression",
            "BooleanLiteral",
            "ArrowFunction",
            "LogicalOperator",
        ]},
    mutate: [
        "src/server/api/routers/bookings.ts",
        "src/app/bookings/BookingDropDownRow.tsx",
        "src/app/bookings/page.tsx",
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
