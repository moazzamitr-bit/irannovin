import { defineConfig } from 'vitest/config';

export default defineConfig({
  // BigInt literals are pervasive in this package — the default esbuild target
  // predates them and silently fails to parse the test suite.
  esbuild: { target: 'es2022' },
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
});
