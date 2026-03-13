import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";
import { config } from "dotenv";
config({ path: ".env.test" });

export default defineConfig({
    test: {
        projects: [
            {
                plugins: [tsconfigPaths(), react()],
                test: {
                    name: "frontend",
                    environment: "happy-dom",
                    globals: true,
                    include: ["src/app/**/*.test.{ts,tsx}"],
                    setupFiles: "./setupTests.ts",
                },
            },
            {
                plugins: [tsconfigPaths()],
                test: {
                    name: "backend",
                    environment: "node",
                    include: [
                        "src/lib/**/*.test.ts",
                        "src/server/**/*.test.ts",
                    ],
                },
            },
            {
                plugins: [tsconfigPaths()],
                test: {
                    name: "integration",
                    environment: "node",
                    include: ["src/tests/integration/**/*.test.ts"],
                    fileParallelism: false,
                },
            }
        ],
    },
});
