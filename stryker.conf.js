// @ts-check

const config = {
  packageManager: "pnpm",
  plugins: ["@stryker-mutator/vitest-runner"],
  testRunner: "vitest",
  coverageAnalysis: "perTest",
  reporters: ["clear-text", "progress", "html", "json"],
  thresholds: {
    high: 80,
    low: 60,
    break: null,
  },
  mutate: [
    "src/app/bookings/BookingDropDownRow.tsx",
    "src/app/bookings/page.tsx",
    "src/app/movies/nowPlaying.tsx",
    "src/app/movies/[[]movieId]/page.tsx",
    "src/lib/utils.ts",
    "src/server/api/routers/bookings.ts",
    "src/server/api/routers/bookingSession.ts",
    "src/server/api/routers/movies.ts",
    "src/server/api/routers/showtimeSeats.ts",
    "src/server/services/tmdb.ts",
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
