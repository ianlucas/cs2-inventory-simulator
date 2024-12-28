/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { DEFAULT_APP_NAME } from "~/app-defaults";
import { appName } from "~/models/rule.server";

export async function loader() {
  const name = (await appName.get()) || DEFAULT_APP_NAME;
  return Response.json(
    {
      background_color: "#292524",
      display: "standalone",
      icons: [
        {
          src: "/images/thumbnails/512.png",
          sizes: "512x512",
          type: "image/png"
        },
        {
          src: "/images/thumbnails/192.png",
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: "/images/thumbnails/192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable"
        },
        {
          src: "/images/thumbnails/512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable"
        }
      ],
      name,
      shortname: name,
      start_url: "index.html",
      orientation: "portrait",
      theme_color: "#292524"
    },
    {
      headers: {
        "Content-Type": "application/manifest+json"
      }
    }
  );
}
