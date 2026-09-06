import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // The integration tests talk to a real Postgres over the network, and a
    // serverless instance can take a second or two to wake from idle before
    // it answers the first query. Vitest's 5s default is comfortable for the
    // pure unit tests but too tight for that, so give every test room.
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
