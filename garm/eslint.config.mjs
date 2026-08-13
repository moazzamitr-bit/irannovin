// Shared flat config for the platform packages. SPEC §13.
// The existing marketing app (apps/irannovin) keeps its own Next.js config.
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', '**/*.config.ts', '**/*.config.mjs'] },
  ...tseslint.configs.strict,
  {
    rules: {
      // The financial core is the one place `any` is genuinely dangerous:
      // it disables exactly the checks that stop a number reaching money math.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
  },
);
