/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CSSProperties, useSyncExternalStore } from "react";
import { useRules } from "~/components/app-context";
import { ICON_HEIGHT, ICON_WIDTH } from "~/item-icon";
import {
  getIconGeneratorGeneration,
  isIconGeneratorWanted,
  subscribeIconGeneratorWanted
} from "~/item-icon-generator-role.client";
import {
  getIconGeneratorSeed,
  setIconGeneratorApi
} from "~/item-icon-queue.client";
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

function isIconGeneratorWantedServer(): boolean {
  return false;
}

function getIconGeneratorGenerationServer(): number {
  return 0;
}

export function ItemIconGenerator() {
  const { viewerAssetsBaseUrl, viewerEmbedUrl, viewerKey } = useRules();
  const wanted = useSyncExternalStore(
    subscribeIconGeneratorWanted,
    isIconGeneratorWanted,
    isIconGeneratorWantedServer
  );
  const generation = useSyncExternalStore(
    subscribeIconGeneratorWanted,
    getIconGeneratorGeneration,
    getIconGeneratorGenerationServer
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
      item={getIconGeneratorSeed()}
      key={generation}
      onApi={setIconGeneratorApi}
      style={PAINTED_BUT_INVISIBLE_STYLE}
      tabIndex={-1}
      title="CS2 3D viewer (inventory icons)"
    />
  );
}
