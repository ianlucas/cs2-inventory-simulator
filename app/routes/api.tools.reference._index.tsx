/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { access, readFile } from "fs/promises";
import { join } from "path";
import { z } from "zod";
import { STICKER_REFERENCE_PATH } from "~/env.server";
import { badRequest } from "~/responses.server";
import { Route } from "./+types/api.tools.reference._index";

export async function loader({ request }: Route.LoaderArgs) {
  if (STICKER_REFERENCE_PATH === undefined) {
    throw badRequest;
  }

  const url = new URL(request.url);
  const fileName = z.string().parse(url.searchParams.get("file"));

  const filePath = join(STICKER_REFERENCE_PATH, fileName);
  if (!filePath.startsWith(STICKER_REFERENCE_PATH)) {
    throw badRequest;
  }

  await access(filePath);
  const buffer = await readFile(filePath);
  const mimeType = "image/png";
  return new Response(buffer, {
    headers: {
      "Content-Type": mimeType
    }
  });
}
