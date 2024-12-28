/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { reactRouter } from "@react-router/dev/vite";
import { readFileSync } from "fs";
import { resolve } from "path";
import { minify_sync } from "terser";
import ts from "typescript";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    port: 3000
  },
  plugins: [!process.env.VITEST && reactRouter(), tsconfigPaths()],
  define: {
    __SPLASH_SCRIPT__: JSON.stringify(
      minify_sync(
        ts.transpileModule(
          readFileSync(resolve(process.cwd(), "app/utils/splash.ts"), {
            encoding: "utf-8"
          }),
          {
            compilerOptions: {
              module: ts.ModuleKind.CommonJS,
              noImplicitUseStrict: true,
              target: ts.ScriptTarget.ES2022
            }
          }
        ).outputText
      ).code
    )
  }
});
