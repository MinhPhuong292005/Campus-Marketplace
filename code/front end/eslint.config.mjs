import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import unusedImports from 'eslint-plugin-unused-imports';
import boundaries from 'eslint-plugin-boundaries';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', '.husky'] },
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
      'unused-imports': unusedImports,
      'boundaries': boundaries,
    },
    settings: {
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [
        { type: 'components-base', pattern: 'src/components/base/*' },
        { type: 'components-features', pattern: 'src/components/features/*' },
        { type: 'pages', pattern: 'src/pages/*' },
        { type: 'services', pattern: 'src/services/*' },
        { type: 'store', pattern: 'src/store/*' },
        { type: 'types', pattern: 'src/types/*' },
        { type: 'utils', pattern: 'src/utils/*' },
        { type: 'constants', pattern: 'src/constants/*' },
      ],
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      /* Strict Quality & Convention Rules */
      '@typescript-eslint/no-explicit-any': 'error',
      'no-magic-numbers': ['warn', { ignore: [0, 1, -1, 200, 400, 401, 403, 404, 500], ignoreArrayIndexes: true }],
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
      ],

      /* Architectural Boundaries (No illegal cross-imports) */
      'boundaries/element-types': [
        'error',
        {
          default: 'allow',
          rules: [
            {
              from: ['components-base'],
              disallow: ['components-features', 'pages', 'store'],
              message: 'Base components must remain atomic and independent of business features and pages',
            },
            {
              from: ['services'],
              disallow: ['pages', 'components-features', 'components-base'],
              message: 'Services should not depend on UI components or pages',
            },
          ],
        },
      ],
    },
  }
);
