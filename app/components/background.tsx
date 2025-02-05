/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useMemo } from "react";
import { backgrounds } from "~/data/backgrounds";
import { random } from "~/utils/misc";
import { usePreferences } from "./app-context";

export function Background() {
  const { background: current } = usePreferences();

  const background = useMemo(() => {
    return current ?? random(backgrounds).value;
  }, [current]);

  return (
    <video
      autoPlay
      className="fixed top-0 left-0 -z-10 h-screen w-screen object-cover opacity-50 saturate-200 lg:blur-xs"
      disablePictureInPicture={true}
      loop
      muted
      onContextMenu={(event) => event.preventDefault()}
      src={`/videos/bg-${background}.webm`}
      suppressHydrationWarning
    />
  );
}
