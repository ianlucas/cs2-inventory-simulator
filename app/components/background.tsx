/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";
import { useRootContext } from "./root-context";

export function Background() {
  const {
    preferences: { background }
  } = useRootContext();

  return (
    <ClientOnly
      children={() =>
        createPortal(
          <div className="flex h-full w-full items-center justify-center">
            <video
              autoPlay
              className="h-screen object-cover opacity-50 saturate-200 lg:h-auto lg:w-full"
              disablePictureInPicture={true}
              loop
              muted
              onContextMenu={(event) => event.preventDefault()}
              src={`/videos/bg-${background}.webm`}
            />
          </div>,
          document.getElementById("background")!
        )
      }
    />
  );
}
