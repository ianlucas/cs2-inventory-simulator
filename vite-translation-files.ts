/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { CS2ItemTranslationMap } from "@ianlucas/cs2-lib";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { Worker } from "node:worker_threads";
import { brotliCompress, constants, gzip } from "node:zlib";
import { type Plugin, runnerImport } from "vite";
import { languageNames } from "./app/data/languages.ts";
import { encodeItemTranslationMap } from "./app/item-translation-file.server.ts";
import { getTranslationFileName } from "./app/translation-files.ts";

const brotliCompressAsync = promisify(brotliCompress);
const gzipAsync = promisify(gzip);

// Builds the translations the client fetches as static files with .br and .gz
// siblings, so the server doesn't hold every language in memory. Item files
// also get a server-only index for looking up a single item.
export function translationFiles(): Plugin {
  const hashes = {
    item: hash(
      JSON.parse(readSource("node_modules/@ianlucas/cs2-lib/package.json"))
        .version,
      readSource("app/item-translation-file.server.ts"),
      readSource("vite-translation-files.ts")
    ),
    ui: hash(
      ...languageNames.map((language) =>
        readSource(`app/translations/${language}.ts`)
      ),
      readSource("vite-translation-files.ts")
    )
  };

  return {
    name: "translation-files",
    config() {
      return {
        define: {
          __ITEM_TRANSLATION_HASH__: JSON.stringify(hashes.item),
          __UI_TRANSLATION_HASH__: JSON.stringify(hashes.ui)
        }
      };
    },
    buildApp: {
      // After React Router has built (and cleaned) the client and server.
      order: "post",
      async handler(builder) {
        const { root } = builder.config;
        const clientDir = resolve(
          root,
          builder.environments.client.config.build.outDir,
          "translations"
        );
        const serverDir = resolve(
          root,
          builder.environments.ssr.config.build.outDir,
          "translations"
        );
        await mkdir(clientDir, { recursive: true });
        await mkdir(serverDir, { recursive: true });
        const { module: uiTranslations } = await runnerImport<
          Record<string, Record<string, string>>
        >(resolve(root, "app/translations/index.ts"), {
          resolve: { tsconfigPaths: true }
        });
        for (const language of languageNames) {
          const { json, index } = encodeItemTranslationMap(
            await loadItemTranslationMap(language)
          );
          await writeCompressed(
            resolve(
              clientDir,
              getTranslationFileName("item", language, hashes.item)
            ),
            json
          );
          await writeFile(
            resolve(
              serverDir,
              getTranslationFileName("item", language, hashes.item, "idx")
            ),
            index
          );
          await writeCompressed(
            resolve(
              clientDir,
              getTranslationFileName("ui", language, hashes.ui)
            ),
            Buffer.from(JSON.stringify(uiTranslations[language]))
          );
        }
      }
    }
  };
}

function readSource(path: string) {
  return readFileSync(resolve(path), "utf-8");
}

function hash(...inputs: string[]) {
  return createHash("sha256")
    .update(inputs.join(""))
    .digest("hex")
    .substring(0, 7);
}

// Each language is imported in a worker that exits afterwards: modules can't
// be unloaded, and importing all of them here would hold ~650 MiB.
function loadItemTranslationMap(language: string) {
  return new Promise<CS2ItemTranslationMap>((fulfill, reject) => {
    new Worker(
      `const { parentPort, workerData } = require("node:worker_threads");
      import(workerData.url).then((module) =>
        parentPort.postMessage(module[workerData.language])
      );`,
      {
        eval: true,
        workerData: {
          language,
          url: import.meta.resolve(`@ianlucas/cs2-lib/translations/${language}`)
        }
      }
    )
      .once("message", fulfill)
      .once("error", reject);
  });
}

async function writeCompressed(path: string, data: Buffer) {
  const [gzipped, brotlied] = await Promise.all([
    gzipAsync(data, { level: 9 }),
    brotliCompressAsync(data, {
      params: {
        [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT,
        [constants.BROTLI_PARAM_QUALITY]: 9,
        [constants.BROTLI_PARAM_SIZE_HINT]: data.length
      }
    })
  ]);
  await Promise.all([
    writeFile(path, data),
    writeFile(`${path}.gz`, gzipped),
    writeFile(`${path}.br`, brotlied)
  ]);
}
