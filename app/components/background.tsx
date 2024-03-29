/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useRootContext } from "./root-context";

export function Background() {
  const {
    preferences: { background }
  } = useRootContext();

  return (
    <video
      autoPlay
      className="fixed left-0 top-0 -z-10 h-screen w-screen object-cover opacity-50 saturate-200 lg:blur-sm"
      disablePictureInPicture={true}
      loop
      muted
      onContextMenu={(event) => event.preventDefault()}
      src={`/videos/bg-${background}.webm`}
    />
  );
}
