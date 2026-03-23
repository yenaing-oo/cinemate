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
        excludedMutations: ["StringLiteral", "ObjectLiteral", "BlockStatement"],
    },
    mutate: [
        "src/server/api/routers/email.ts",
        "src/server/emailTemplates/TicketConfirmation.tsx",
        "src/server/emailTemplates/BookingCancellation.tsx",
        "!src/**/*.test.ts",
        "!src/**/*.test.tsx",
    ],
    vitest: {
        configFile: "vitest.config.mts",
        related: true,
    },
    tempDirName: ".stryker-tmp-feature3",
};

export default config;
