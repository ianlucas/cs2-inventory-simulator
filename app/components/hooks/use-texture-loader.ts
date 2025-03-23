/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useLoader } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { TextureLoader } from "three";

export function useTextureLoader(input: string) {
  const texture = useLoader(TextureLoader, input);

  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  }>();

  useEffect(() => {
    if (!texture.source.data) {
      return;
    }

    function handleLoad() {
      setDimensions({
        width: texture.source.data.width,
        height: texture.source.data.height
      });
    }

    if (texture.source.data.height !== 0) {
      handleLoad();
      return;
    }

    texture.source.data.addEventListener("load", handleLoad);
    return () => texture.source.data.removeEventListener("load", handleLoad);
  }, [texture]);

  return { texture, dimensions };
}
