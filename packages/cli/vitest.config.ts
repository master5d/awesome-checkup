import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    // probe tests spawn git; on Windows a process spawn costs ~0.5s — the 5s default flakes
    testTimeout: 30_000,
  },
});
