// @ts-check
// Shared ESLint flat config for all workspaces — see specs/005-ci-quality-gates/design.md D-002.
// Rules without type information: lint does not depend on ^build.
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['**/dist/**', '**/node_modules/**', '**/.turbo/**', '**/coverage/**'] },
  {
    files: ['**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
  },
);
