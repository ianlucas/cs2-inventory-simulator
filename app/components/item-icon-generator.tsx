/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useSyncExternalStore } from "react";
import { useRules } from "~/components/app-context";
import { ICON_HEIGHT, ICON_WIDTH } from "~/utils/item-icon";
import {
  isIconGeneratorWanted,
  isIconGeneratorWantedServer,
  setIconGeneratorApi,
  subscribeIconGeneratorWanted
} from "~/utils/item-icon-queue";
import { Viewer } from "./viewer";

/**
 * The one viewer instance every inventory icon is rendered through.
 *
 * It is invisible but deliberately *painted*: browsers throttle rendering in a
 * cross-origin iframe that is `display: none`, `visibility: hidden`, or
 * scrolled out of the viewport, and a throttled capture does not degrade, it
 * stalls. Sizing it to the icon is what makes the frame come back at that size,
 * since the viewer pins its device pixel ratio to 1 in capture mode.
 *
 * It mounts only while there is work and unmounts once the queue drains, so an
 * idle tab is not holding a WebGL context the inspector may need.
 */
export function ItemIconGenerator() {
  const { viewerAssetsBaseUrl, viewerEmbedUrl, viewerKey } = useRules();
  const wanted = useSyncExternalStore(
    subscribeIconGeneratorWanted,
    isIconGeneratorWanted,
    isIconGeneratorWantedServer
  );
  if (!wanted) {
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
      onApi={setIconGeneratorApi}
      style={{
        border: 0,
        bottom: 0,
        colorScheme: "normal",
        height: ICON_HEIGHT,
        opacity: 0,
        pointerEvents: "none",
        position: "fixed",
        right: 0,
        width: ICON_WIDTH
      }}
      tabIndex={-1}
      title="CS2 3D viewer (inventory icons)"
    />
  );
}
