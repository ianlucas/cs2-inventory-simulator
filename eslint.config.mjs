// @ts-check

import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  { ignores: ["build/", ".react-router/"] },
  eslint.configs.recommended,
  tseslint.configs.strict,
  {
    rules: {
      "no-empty": ["error", { allowEmptyCatch: true }],
      "@typescript-eslint/no-unused-vars": ["error", { caughtErrors: "none" }],
      "prefer-const": ["error", { destructuring: "all" }],
      "@typescript-eslint/no-dynamic-delete": "off"
    }
  }
);
