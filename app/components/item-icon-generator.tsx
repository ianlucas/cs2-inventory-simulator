/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CSSProperties, useSyncExternalStore } from "react";
import { useRules } from "~/components/app-context";
import { ICON_HEIGHT, ICON_WIDTH } from "~/utils/item-icon";
import {
  getIconGeneratorGeneration,
  getIconGeneratorGenerationServer,
  isIconGeneratorWanted,
  isIconGeneratorWantedServer,
  subscribeIconGeneratorWanted
} from "~/utils/item-icon-generator-role";
import {
  getIconGeneratorSeed,
  setIconGeneratorApi
} from "~/utils/item-icon-queue";
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
