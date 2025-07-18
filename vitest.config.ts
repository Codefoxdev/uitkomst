import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      enabled: true,
      reporter: ["html"],
      include: ["src/**"],
    },
  },
});
