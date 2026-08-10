const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');
const eslintCommentsPlugin = require('@eslint-community/eslint-plugin-eslint-comments');
const { importX } = require('eslint-plugin-import-x');
const {
  createTypeScriptImportResolver,
} = require('eslint-import-resolver-typescript');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

const tsFiles = ['**/*.ts'];

module.exports = [
  { ignores: ['node_modules/**', 'dist/**', 'coverage/**'] },
  ...compat
    .config({
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: './tsconfig.json',
      },
      env: {
        es6: true,
      },
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier',
      ],
      globals: {
        BigInt: true,
        console: true,
        WebAssembly: true,
      },
      rules: {
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'sort-imports': [
          'error',
          {
            ignoreDeclarationSort: true,
            ignoreCase: true,
          },
        ],
      },
    })
    .map((config) => ({ ...config, files: tsFiles })),
  { ...importX.flatConfigs.recommended, files: tsFiles },
  { ...importX.flatConfigs.typescript, files: tsFiles },
  {
    files: tsFiles,
    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          alwaysTryTypes: true,
        }),
      ],
    },
    rules: {
      'import-x/order': [
        'error',
        {
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
          },
        },
      ],
    },
  },
  {
    files: tsFiles,
    plugins: {
      '@eslint-community/eslint-comments': eslintCommentsPlugin,
    },
    rules: {
      '@eslint-community/eslint-comments/disable-enable-pair': [
        'error',
        {
          allowWholeFile: true,
        },
      ],
      '@eslint-community/eslint-comments/no-unused-disable': 'error',
    },
  },
];
