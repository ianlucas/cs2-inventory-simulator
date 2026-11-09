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
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from "react";
import { useViewer } from "./hooks/use-viewer";
import { useViewerAvailability } from "./hooks/use-viewer-availability";
import { useViewerStatus } from "./hooks/use-viewer-status";
import { ItemEditorName } from "./item-editor-name";
import { ItemImage } from "./item-image";
import { Viewer } from "./viewer";

export interface EditorItemImageTarget {
  box: HTMLElement | null;
  image: HTMLImageElement | null;
  is3d: boolean;
}

interface EditorItemImageHandoff {
  isImageHidden: boolean;
  isRevealHeld: boolean;
  onImageLoad?: () => void;
  target?: EditorItemImageTarget;
}

const EditorItemImageContext = createContext<EditorItemImageHandoff>({
  isImageHidden: false,
  isRevealHeld: false
});

export function EditorItemImageProvider({
  children,
  value
}: {
  children: ReactNode;
  value: EditorItemImageHandoff;
}) {
  return (
    <EditorItemImageContext.Provider value={value}>
      {children}
    </EditorItemImageContext.Provider>
  );
}

function useEditorItemImageHandoff() {
  const handoff = useContext(EditorItemImageContext);
  const { target } = handoff;
  const boxRef = useCallback(
    (box: HTMLElement | null) => {
      if (target !== undefined) {
        target.box = box;
      }
    },
    [target]
  );
  const imageRef = useCallback(
    (image: HTMLElement | null) => {
      if (target !== undefined) {
        target.image = image instanceof HTMLImageElement ? image : null;
      }
    },
    [target]
  );
  const setIs3d = useCallback(
    (is3d: boolean) => {
      if (target !== undefined) {
        target.is3d = is3d;
      }
    },
    [target]
  );
  return { ...handoff, boxRef, imageRef, setIs3d };
}

interface EditorItemDisplayProps {
  item: CS2EconomyItem;
  keychains?: CS2BaseInventoryItem["keychains"];
  nameTag?: string;
  seed?: number;
  statTrak?: number;
  stickers?: CS2BaseInventoryItem["stickers"];
  style?: number;
  upgradeLevel?: number;
  wear?: number;
}

function EditorItem2dPreview({
  item,
  wear
}: Pick<EditorItemDisplayProps, "item" | "wear">) {
  const { boxRef, imageRef, isImageHidden, onImageLoad, setIs3d } =
    useEditorItemImageHandoff();
  const ref = useCallback(
    (image: HTMLImageElement | null) => {
      boxRef(image);
      imageRef(image);
    },
    [boxRef, imageRef]
  );

  useLayoutEffect(() => setIs3d(false), [setIs3d]);

  return (
    <ItemImage
      className={clsx("m-auto w-[256px]", isImageHidden && "invisible")}
      item={item}
      onLoad={onImageLoad}
      ref={ref}
      wear={item.hasWear() ? wear : undefined}
    />
  );
}

function EditorItem3dPreview({
  item,
  keychains,
  nameTag,
  seed,
  statTrak,
  stickers,
  style,
  upgradeLevel,
  wear
}: EditorItemDisplayProps) {
  const [initialItem] = useState<CS2BaseInventoryItem>(() => ({
    id: item.id,
    keychains,
    nameTag,
    seed,
    statTrak,
    stickers,
    style,
    upgradeLevel,
    wear
  }));
  const { api, viewerProps } = useViewer({ item: initialItem });
  const viewerStatus = useViewerStatus(api);
  const {
    boxRef,
    imageRef,
    isImageHidden,
    isRevealHeld,
    onImageLoad,
    setIs3d
  } = useEditorItemImageHandoff();
  const imageLoadedRef = useRef(false);
  const [viewerReveal, setViewerReveal] = useState<
    "pending" | "instant" | "fade"
  >("pending");
  const reveal = isRevealHeld ? "pending" : viewerReveal;

  useLayoutEffect(() => setIs3d(reveal !== "pending"), [reveal, setIs3d]);

  useEffect(() => {
    if (api === undefined) {
      return;
    }
    return api.once("rendered", () => {
      setViewerReveal(imageLoadedRef.current ? "fade" : "instant");
    });
  }, [api]);

  useEffect(() => {
    api?.setItem({
      id: item.id,
      keychains,
      nameTag,
      seed,
      statTrak,
      stickers,
      style,
      upgradeLevel,
      wear
    });
  }, [
    api,
    item.id,
    keychains,
    nameTag,
    seed,
    statTrak,
    stickers,
    style,
    upgradeLevel,
    wear
  ]);

  if (viewerStatus.isUnavailable) {
    return <EditorItem2dPreview item={item} wear={wear} />;
  }

  return (
    <div className="relative m-auto aspect-256/192 w-[256px]" ref={boxRef}>
      <ItemImage
        className={clsx(
          "absolute inset-0 w-full",
          isImageHidden && "invisible",
          reveal === "instant" && "opacity-0",
          reveal === "fade" &&
            "opacity-0 transition-opacity delay-1000 duration-1000"
        )}
        item={item}
        onLoad={() => {
          imageLoadedRef.current = true;
          onImageLoad?.();
        }}
        ref={imageRef}
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
  keychains,
  nameTag,
  seed,
  statTrak,
  stickers,
  style,
  upgradeLevel,
  wear
}: EditorItemDisplayProps) {
  const { canUse3d } = useViewerAvailability({
    id: item.id,
    stickers,
    keychains
  });
  return (
    <>
      {canUse3d && !item.isSticker() ? (
        <EditorItem3dPreview
          key={item.id}
          item={item}
          keychains={keychains}
          nameTag={nameTag}
          seed={seed}
          statTrak={statTrak}
          stickers={stickers}
          style={style}
          upgradeLevel={upgradeLevel}
          wear={wear}
        />
      ) : (
        <EditorItem2dPreview item={item} wear={wear} />
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
