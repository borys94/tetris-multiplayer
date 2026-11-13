import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores(["**/dist/", "**/coverage/", ".yarn/"]),
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: ["*.ts"] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["*.js", "*.ts"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["**/*.js"],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ["apps/web/src/**/*.{ts,tsx}"],
    extends: [reactHooks.configs.flat["recommended-latest"]],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["apps/server/src/**/*.ts"],
    languageOptions: { globals: globals.node },
  },
  prettier,
);
