/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2BaseInventoryItem, CS2InventoryItem } from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { toInventoryItem } from "~/shared/inventory";
import { VIEWER_INSPECT_KINDS, toViewerItem } from "~/viewer";
import { useViewer } from "./hooks/use-viewer";
import { useViewerAvailability } from "./hooks/use-viewer-availability";
import { useViewerStatus } from "./hooks/use-viewer-status";
import { ItemImage } from "./item-image";
import { Viewer } from "./viewer";

const LOADOUT_AGENT_ZOOM = 0.2;

interface LoadoutAgentProps {
  item: CS2InventoryItem | CS2BaseInventoryItem;
}

function LoadoutAgent2d({ item }: LoadoutAgentProps) {
  return <ItemImage className="w-full" item={toInventoryItem(item)} />;
}

function LoadoutAgent3d({ item }: LoadoutAgentProps) {
  const { api, viewerProps } = useViewer({ item });
  const viewerStatus = useViewerStatus(api);
  const [isLoading, setIsLoading] = useState(true);
  const appearance = JSON.stringify(toViewerItem(item));

  useEffect(() => api?.on("loading", ({ busy }) => setIsLoading(busy)), [api]);

  useEffect(() => {
    api?.setItem(item);
  }, [api, appearance]);

  if (viewerStatus.isUnavailable) {
    return <LoadoutAgent2d item={item} />;
  }

  return (
    <Viewer
      {...viewerProps}
      className="pointer-events-none size-full border-0 bg-transparent"
      pauseIcons={isLoading}
      style={{ colorScheme: "normal" }}
      zoom={LOADOUT_AGENT_ZOOM}
    />
  );
}

export function LoadoutAgent({
  className,
  item
}: LoadoutAgentProps & { className?: string }) {
  const { canUse3d } = useViewerAvailability(item, {
    kinds: VIEWER_INSPECT_KINDS
  });
  return (
    <div className={clsx("flex items-center justify-center", className)}>
      {canUse3d ? (
        <LoadoutAgent3d item={item} />
      ) : (
        <LoadoutAgent2d item={item} />
      )}
    </div>
  );
}
