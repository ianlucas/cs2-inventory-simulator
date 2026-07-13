/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2BaseInventoryItem,
  CS2EconomyItem,
  CS2ItemType
} from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { useViewer } from "./hooks/use-viewer";
import { useViewerAvailability } from "./hooks/use-viewer-availability";
import { useViewerStatus } from "./hooks/use-viewer-status";
import { ItemEditorName } from "./item-editor-name";
import { ItemImage } from "./item-image";
import { Viewer } from "./viewer";

interface EditorItemDisplayProps {
  item: CS2EconomyItem;
  nameTag?: string;
  seed?: number;
  statTrak?: number;
  stickers?: CS2BaseInventoryItem["stickers"];
  wear?: number;
}

function EditorItem3dPreview({
  item,
  nameTag,
  seed,
  statTrak,
  stickers,
  wear
}: EditorItemDisplayProps) {
  const [initialItem] = useState<CS2BaseInventoryItem>(() => ({
    id: item.id,
    nameTag,
    seed,
    statTrak,
    stickers,
    wear
  }));
  const { api, viewerProps } = useViewer({ item: initialItem });
  useViewerStatus(api);
  const lastItemRef = useRef(initialItem);
  const imageLoadedRef = useRef(false);
  const [reveal, setReveal] = useState<"pending" | "instant" | "fade">(
    "pending"
  );

  useEffect(() => {
    if (api === undefined) {
      return;
    }
    return api.once("rendered", () => {
      setReveal(imageLoadedRef.current ? "fade" : "instant");
    });
  }, [api]);

  useEffect(() => {
    if (api === undefined) {
      return;
    }
    const last = lastItemRef.current;
    const next: CS2BaseInventoryItem = {
      id: item.id,
      nameTag,
      seed,
      statTrak,
      stickers,
      wear
    };
    lastItemRef.current = next;
    if (
      next.nameTag !== last.nameTag ||
      next.statTrak !== last.statTrak ||
      next.stickers !== last.stickers
    ) {
      api.setItem(next);
      return;
    }
    if (next.wear !== last.wear && next.wear !== undefined) {
      api.setWear({ wear: next.wear });
    }
    if (next.seed !== last.seed && next.seed !== undefined) {
      api.setSeed({ seed: next.seed });
    }
  }, [api, item.id, nameTag, seed, statTrak, stickers, wear]);

  return (
    <div className="relative m-auto aspect-256/192 w-[256px]">
      <ItemImage
        className={clsx(
          "absolute inset-0 w-full",
          reveal === "instant" && "opacity-0",
          reveal === "fade" &&
            "opacity-0 transition-opacity delay-1000 duration-1000"
        )}
        item={item}
        onLoad={() => {
          imageLoadedRef.current = true;
        }}
        wear={item.hasWear() ? wear : undefined}
      />
      <Viewer
        {...viewerProps}
        className={clsx(
          "absolute inset-0 size-full border-0 bg-transparent",
          reveal === "pending" && "opacity-0",
          reveal === "fade" && "transition-opacity duration-1000"
        )}
        icon
        style={{ colorScheme: "normal" }}
      />
    </div>
  );
}

export function EditorItemDisplay({
  item,
  nameTag,
  seed,
  statTrak,
  stickers,
  wear
}: EditorItemDisplayProps) {
  const { canUse3d } = useViewerAvailability({ id: item.id, stickers });
  return (
    <>
      {canUse3d && !item.isSticker() ? (
        <EditorItem3dPreview
          key={item.id}
          item={item}
          nameTag={nameTag}
          seed={seed}
          statTrak={statTrak}
          stickers={stickers}
          wear={wear}
        />
      ) : (
        <ItemImage
          className="m-auto w-[256px]"
          item={item}
          wear={item.hasWear() ? wear : undefined}
        />
      )}
      <div
        className={clsx(
          "mb-2 text-center",
          item.type === CS2ItemType.Agent && "mt-4"
        )}
      >
        <ItemEditorName item={item} />
      </div>
    </>
  );
}
