import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    setupFiles: ["./src/setupTests.ts"],
    include: ["src/**/*.test.ts", "src/**/__tests__/**/*.ts"],
    exclude: ["node_modules", "dist", "**/*.d.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      reportsDirectory: "coverage",
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.d.ts",
        "src/components/ultrasound-focusing/main.ts", // Exclude main.ts as it's DOM-heavy
        "src/setupTests.ts",
      ],
    },
    globals: true,
  },
});
