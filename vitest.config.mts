import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";

export default defineConfig({
    test: {
        projects: [
            {
                name: "frontend",
                plugins: [tsconfigPaths(), react()],
                test: {
                    environment: "happy-dom",
                    globals: true,
                    include: ["src/app/**/*.test.{ts,tsx}"],
                    setupFiles: "./setupTests.ts",
                },
            },
            {
                name: "backend",
                plugins: [tsconfigPaths()],
                test: {
                    environment: "node",
                    include: [
                        "src/lib/**/*.test.ts",
                        "src/server/**/*.test.ts",
                    ],
                },
            },
        ],
    },
});
