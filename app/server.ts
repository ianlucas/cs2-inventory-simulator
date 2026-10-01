/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { compress } from "hono/compress";
import { createHonoServer } from "react-router-hono-server/node";
import { initServerMonitoring } from "./monitoring.server";
import {
  cacheTranslationFiles,
  serveTranslationFilesInDev
} from "./translation-files.server";

// Before `createHonoServer` imports the app, so errors from its startup are
// reported too.
initServerMonitoring();

export default await createHonoServer({
  // Only errors go to the log, so no per-request lines.
  defaultLogger: false,
  // Translation files are built with .br and .gz siblings.
  serveStaticOptions: { publicAssets: { precompressed: true } },
  beforeAll(app) {
    app.use(compress());
    app.use(
      "/translations/*",
      import.meta.env.DEV ? serveTranslationFilesInDev : cacheTranslationFiles
    );
  }
});
