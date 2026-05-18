import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginPromise from 'eslint-plugin-promise';
import pluginJsxA11y from 'eslint-plugin-jsx-a11y';
import pluginImport from 'eslint-plugin-import';
import pluginRegex from 'eslint-plugin-regex';
import pluginVitest from '@vitest/eslint-plugin';
import pluginStorybook from 'eslint-plugin-storybook';
import pluginComments from '@eslint-community/eslint-plugin-eslint-comments';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default defineConfig([
  globalIgnores(['**/node_modules/', '**/dist/', '**/test/', '.storybook/public/', 'coverage']),

  js.configs.recommended,

  {
    plugins: { '@eslint-community/eslint-comments': pluginComments },
    rules: pluginComments.configs.recommended.rules,
  },

  ...pluginStorybook.configs['flat/recommended'],

  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jquery,
        ...globals.node,
        angular: 'readonly',
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-console': 'error',
      'no-alert': 'error',
      'no-control-regex': 'error',
      'no-empty': 'warn',
      'no-empty-function': 'warn',
      'no-useless-escape': 'off',
      // Preserve ESLint 8 default: catch-block error variables are not checked
      'no-unused-vars': ['error', { caughtErrors: 'none' }],
    },
  },

  {
    files: ['app/**/*.ts', 'app/**/*.tsx'],

    extends: [
      ...tseslint.configs.recommended,

      pluginReact.configs.flat.recommended,
      pluginReact.configs.flat['jsx-runtime'],

      pluginReactHooks.configs.flat['recommended-latest'],

      pluginJsxA11y.flatConfigs.recommended,

      pluginImport.flatConfigs.typescript,

      // @ts-expect-error - pluginPromise don't have types so it errors
      pluginPromise.configs['flat/recommended'],
    ],

    plugins: {
      regex: pluginRegex,
    },

    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.json',
      },
    },

    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        alias: {
          map: [
            ['@@', './app/react/components'],
            ['@', './app'],
          ],
          extensions: ['.js', '.ts', '.tsx'],
        },
        typescript: true,
        node: true,
      },
    },

    rules: {
      'no-console': 'error',
      'no-use-before-define': 'off',
      'no-shadow': 'off',
      'no-plusplus': 'off',
      'no-underscore-dangle': 'off',
      'no-await-in-loop': 'off',
      'consistent-return': 'off',
      'default-case': 'off', // covered by @typescript-eslint/switch-exhaustiveness-check
      'func-style': ['error', 'declaration'],
      'no-continue': 'error',
      'no-template-curly-in-string': 'warn',
      // Allow named function expressions where `this` binding is needed (e.g. Yup .test())
      'prefer-arrow-callback': ['error', { allowNamedFunctions: true }],
      'func-names': 'warn',
      'no-param-reassign': [
        'error',
        {
          props: true,
          ignorePropertyModificationsFor: ['acc', 'accumulator'],
        },
      ],
      'no-restricted-exports': ['error', { restrictedNamedExports: ['default', 'then'] }],
      // Secure-context-only APIs (unavailable over HTTP — Portainer is commonly deployed without TLS).
      // Each entry names the safe alternative. The approved implementations (e.g. useCopy) carry an
      // eslint-disable comment so this list stays the single source of truth.
      //
      // To check whether a new API requires a secure context, fetch its MDN page and look for
      // "Secure context" in the response:
      //   https://developer.mozilla.org/en-US/docs/Web/API/{Interface}/{method}
      // See docs/guidelines/frontend-conventions.md § "Secure-context APIs" for the full policy.
      'no-restricted-properties': [
        'error',
        {
          object: 'crypto',
          property: 'randomUUID',
          message: "crypto.randomUUID() requires a secure context (HTTPS). Use `import { v4 as uuidv4 } from 'uuid'` instead.",
        },
        {
          object: 'crypto',
          property: 'subtle',
          message: 'crypto.subtle requires a secure context (HTTPS). Use a server-side cryptographic alternative.',
        },
        {
          object: 'navigator',
          property: 'clipboard',
          message:
            'navigator.clipboard requires a secure context (HTTPS). Use the `useCopy` hook or `CopyButton` component (@@/buttons/CopyButton) — they include a non-secure fallback.',
        },
        {
          object: 'navigator',
          property: 'mediaDevices',
          message: 'navigator.mediaDevices requires a secure context (HTTPS) and will not work in all Portainer deployment contexts.',
        },
        {
          object: 'navigator',
          property: 'credentials',
          message: 'navigator.credentials requires a secure context (HTTPS) and will not work in all Portainer deployment contexts.',
        },
        {
          object: 'navigator',
          property: 'serviceWorker',
          message: 'navigator.serviceWorker requires a secure context (HTTPS) and will not work in all Portainer deployment contexts.',
        },
      ],

      '@typescript-eslint/no-use-before-define': ['error', { functions: false, allowNamedExports: true }],
      '@typescript-eslint/no-shadow': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      // TODO: fix violations and promote to 'error'
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
      // TODO: fix violations and promote to 'error'
      '@typescript-eslint/switch-exhaustiveness-check': 'warn',
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/react/test-utils/*'],
              message: 'These utils are just for test files',
            },
          ],
        },
      ],

      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/prefer-default-export': 'off',
      'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
      'import/order': [
        'error',
        {
          pathGroups: [
            { pattern: '@@/**', group: 'internal', position: 'after' },
            { pattern: '@/**', group: 'internal' },
          ],
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
        },
      ],

      'react/no-unused-prop-types': 'error',
      'react/button-has-type': 'error',
      'react/forbid-prop-types': 'off',
      'react/require-default-props': 'off',
      'react/jsx-filename-extension': 'off',
      'react/jsx-no-bind': 'off',
      'react/jsx-no-useless-fragment': ['error', { allowExpressions: true }],
      'react/function-component-definition': ['error', { namedComponents: 'function-declaration' }],
      // Enabled explicitly (was brought in by airbnb, turned off in HOC/test/story files below)
      'react/jsx-props-no-spreading': 'error',
      'react/destructuring-assignment': ['error', 'always'],
      // dangerouslySetInnerHTML is allowed when the value is sanitized — add a targeted
      // suppress with a comment explaining the sanitization at each call site
      'react/no-danger': 'error',

      // TODO: fix the underlying violations and promote these to 'error'
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/globals': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',

      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/label-has-associated-control': ['error', { assert: 'either', controlComponents: ['Input', 'Checkbox'] }],
      'jsx-a11y/control-has-associated-label': 'off',

      'regex/invalid': [
        'error',
        [
          {
            regex: '<Icon icon="(.*)"',
            message: 'Please directly import the `lucide-react` icon instead of using the string',
          },
        ],
      ],
    },
  },

  {
    files: ['app/**/with*.ts', 'app/**/with*.tsx'],
    rules: {
      'react/jsx-props-no-spreading': 'off',
      'react/destructuring-assignment': 'off',
    },
  },

  {
    files: ['app/**/*.test.*'],
    plugins: { vitest: pluginVitest },
    languageOptions: {
      // configs.env provides describe/it/expect globals
      globals: pluginVitest.configs.env.languageOptions.globals,
    },
    rules: {
      // configs.recommended provides the rule set
      ...pluginVitest.configs.recommended.rules,
      'react/jsx-no-constructed-context-values': 'off',
      'react/display-name': 'off',
      '@typescript-eslint/no-restricted-imports': 'off',
      'no-restricted-imports': 'off',
      'react/jsx-props-no-spreading': 'off',
      'vitest/no-conditional-expect': 'warn',
      'max-classes-per-file': 'off',
      'no-empty-function': 'off',
      // Tests mock secure-context APIs directly — the restriction is for production code only
      'no-restricted-properties': 'off',
      'vitest/expect-expect': ['warn', { assertFunctionNames: ['expect*', 'assert*', 'verify*'] }],
    },
  },

  {
    files: ['app/**/*.stories.*'],
    rules: {
      'no-alert': 'off',
      '@typescript-eslint/no-restricted-imports': 'off',
      'no-restricted-imports': 'off',
      'react/jsx-props-no-spreading': 'off',
      // Storybook templates use arrow functions / expressions by convention
      'func-style': 'off',
      'react/function-component-definition': 'off',
      'storybook/no-renderer-packages': 'off',
      // Stories use empty no-op callbacks as placeholder handlers by convention
      'no-empty-function': 'off',
    },
  },

  {
    files: ['app/__mocks__/**'],
    rules: {
      // Module mocks are intentionally empty stubs
      'no-empty-function': 'off',
    },
  },

  {
    files: ['.storybook/**/*.ts', '.storybook/**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
    },
    rules: {
      'no-console': 'off',
    },
  },

  //  Prettier (must be last)
  prettier,
]);
