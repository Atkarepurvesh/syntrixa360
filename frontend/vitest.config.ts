import { defineConfig } from "vitest/config";
import path from "node:path";

// Standalone config: unit/integration tests of src/lib only (the app build uses vite.config.ts).
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: { include: ["src/**/*.test.ts"], environment: "node" },
});
