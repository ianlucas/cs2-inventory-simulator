/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { reactRouter } from "@react-router/dev/vite";
import { createHash } from "crypto";
import { readdirSync, readFileSync } from "fs";
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
    ),
    __TRANSLATION_CHECKSUM__: JSON.stringify(
      (() => {
        const translationsDir = resolve(process.cwd(), "app/translations");
        const translationContents = readdirSync(translationsDir)
          .filter((f) => f.endsWith(".ts") && f !== "index.ts")
          .sort()
          .map((f) => readFileSync(resolve(translationsDir, f), "utf-8"))
          .join("");
        const cs2LibVersion = JSON.parse(
          readFileSync(
            resolve(
              process.cwd(),
              "node_modules/@ianlucas/cs2-lib/package.json"
            ),
            "utf-8"
          )
        ).version;
        return createHash("sha256")
          .update(cs2LibVersion + translationContents)
          .digest("hex")
          .substring(0, 7);
      })()
    ),
    __SOURCE_COMMIT__: JSON.stringify(process.env.SOURCE_COMMIT)
  }
});
