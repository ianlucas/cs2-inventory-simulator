/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";

export function Background() {
  return (
    <ClientOnly>
      {() =>
        createPortal(
          <div className="hidden h-full w-full items-center justify-center lg:flex">
            <video
              disablePictureInPicture={true}
              onContextMenu={event => event.preventDefault()}
              className="w-full opacity-50 saturate-200"
              src="/bg.webm"
              autoPlay
              loop
              muted
            >
            </video>
          </div>,
          document.getElementById("background")!
        )}
    </ClientOnly>
  );
}
