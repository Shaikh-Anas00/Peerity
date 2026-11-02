import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist', 'build', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // The codebase uses `catch (err: any)` pervasively to read
      // `err.response?.data?.message` from axios errors — that's an established,
      // deliberate convention here, not something to flag file-by-file.
      '@typescript-eslint/no-explicit-any': 'off',

      // "fetch in a useEffect, setState with the result" is this app's whole
      // data-fetching architecture (useApiResource.ts included) — every page does
      // it. Downgrading rather than disabling: real signal if this app later moves
      // toward Suspense/use(), but not something ~20 pages should hard-fail on today.
      'react-hooks/set-state-in-effect': 'warn',

      // Downgraded to warnings rather than errors: real signal worth seeing, but
      // the existing ~150-file codebase predates this config and wasn't written
      // against it — treating every pre-existing instance as a hard error would
      // make `npx eslint src` fail wholesale on day one instead of being useful
      // incrementally.
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-empty': 'warn',
    },
  },
  eslintConfigPrettier,
);
