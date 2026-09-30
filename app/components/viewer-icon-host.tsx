/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CSSProperties,
  useCallback,
  useEffect,
  useSyncExternalStore
} from "react";
import { useRules } from "~/components/app-context";
import type { ViewerApi } from "~/viewer-api.client";
import { ICON_HEIGHT, ICON_WIDTH } from "~/viewer-icon";
import { viewerIcons } from "~/viewer-icon.client";
import { Viewer } from "./viewer";

const PAINTED_BUT_INVISIBLE_STYLE: CSSProperties = {
  border: 0,
  bottom: 0,
  colorScheme: "normal",
  height: ICON_HEIGHT,
  opacity: 0,
  pointerEvents: "none",
  position: "fixed",
  right: 0,
  width: ICON_WIDTH
};

function subscribe(listener: () => void) {
  return viewerIcons.subscribeGenerator(listener);
}

function getGeneration() {
  return viewerIcons.getMountedGeneration();
}

function getGenerationServer(): undefined {
  return undefined;
}

export function ViewerIconHost() {
  const { viewerAssetsBaseUrl, viewerEmbedUrl, viewerKey } = useRules();
  const generation = useSyncExternalStore(
    subscribe,
    getGeneration,
    getGenerationServer
  );

  useEffect(() => viewerIcons.attachHost(), []);

  const onApi = useCallback(
    (api: ViewerApi | undefined) => {
      if (generation !== undefined) {
        viewerIcons.setApi(generation, api);
      }
    },
    [generation]
  );

  if (generation === undefined) {
    return null;
  }
  return (
    <Viewer
      aria-hidden
      apiKey={viewerKey || undefined}
      capture
      cdn={viewerAssetsBaseUrl || undefined}
      embedUrl={viewerEmbedUrl || undefined}
      icon
      item={viewerIcons.getSeed()}
      key={generation}
      onApi={onApi}
      style={PAINTED_BUT_INVISIBLE_STYLE}
      tabIndex={-1}
      title="CS2 3D viewer (inventory icons)"
    />
  );
}
