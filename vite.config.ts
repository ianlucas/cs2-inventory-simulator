/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync } from "fs";
import { dirname, relative, resolve } from "path";
import { reactRouterHonoServer } from "react-router-hono-server/dev";
import { minify_sync } from "terser";
import ts from "typescript";
import { defineConfig } from "vite";
import { translationFiles } from "./vite-translation-files.ts";

export default defineConfig({
  server: {
    port: 3000
  },
  environments: {
    client: {
      build: {
        sourcemap: process.env.BUILD_SOURCE_MAPS === "true" ? "hidden" : false,
        rolldownOptions: {
          output: {
            sourcemapPathTransform: (source, sourcemapPath) =>
              relative(process.cwd(), resolve(dirname(sourcemapPath), source))
          }
        }
      }
    }
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "cs2-lib",
              test: /node_modules[\\/]@ianlucas[\\/]cs2-lib[\\/]/
            }
          ]
        }
      }
    }
  },
  resolve: {
    tsconfigPaths: true
  },
  plugins: [
    tailwindcss(),
    translationFiles(),
    !process.env.VITEST && reactRouterHonoServer(),
    !process.env.VITEST && reactRouter()
  ],
  define: {
    __SPLASH_SCRIPT__: JSON.stringify(
      minify_sync(
        ts.transpileModule(
          readFileSync(resolve(process.cwd(), "app/splash.client.ts"), {
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
    __SOURCE_COMMIT__: JSON.stringify(process.env.SOURCE_COMMIT)
  }
});
