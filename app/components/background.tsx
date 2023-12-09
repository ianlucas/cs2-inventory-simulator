/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";

export function Background() {
  return (
    <ClientOnly
      children={() =>
        createPortal(
          <div className="flex h-full w-full items-center justify-center">
            <video
              disablePictureInPicture={true}
              onContextMenu={(event) => event.preventDefault()}
              className="h-screen object-cover opacity-50 saturate-200 lg:h-auto lg:w-full"
              src="/bg.webm"
              autoPlay
              loop
              muted
            />
          </div>,
          document.getElementById("background")!
        )
      }
    />
  );
}
