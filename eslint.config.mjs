import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import playwright from 'eslint-plugin-playwright';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [{
        ignores: [
            'node_modules/**',
            'dist/**',
            'build/**',
            'coverage/**',
            'playwright-report/**',
            'test-results/**',
            'allure-results/**',
            'storage/**',
        ],
    },
    eslint.configs.recommended,
    {
        files: ['**/*.ts', '**/*.js'],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                project: './tsconfig.json',
                ecmaVersion: 2022,
                sourceType: 'module',
            },
            globals: {
                console: 'readonly',
                process: 'readonly',
                document: 'readonly',
                window: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tseslint,
            playwright: playwright,
            prettier: prettier,
        },
        rules: {
            ...tseslint.configs.recommended.rules,
            ...prettierConfig.rules,
            'no-var': 'error',
            'prefer-const': 'error',
            'no-console': 'off',
            'no-empty': ['error', { allowEmptyCatch: true }],
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            semi: ['error', 'always'],
            quotes: ['error', 'single', { avoidEscape: true }],
            'prettier/prettier': 'warn',
        },
    },
    {
        files: ['tests/**/*.ts', '**/*.spec.ts'],
        rules: {
            ...playwright.configs.recommended.rules,
            'playwright/expect-expect': 'off',
            'playwright/no-wait-for-timeout': 'warn',
        },
    },
];