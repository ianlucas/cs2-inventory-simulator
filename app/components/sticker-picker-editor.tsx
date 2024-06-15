/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CS2BaseInventoryItem,
  CS2Economy,
  CS2_MAX_STICKERS,
  CS2_MIN_STICKER_WEAR
} from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { ComponentRef, useEffect, useRef, useState } from "react";
import { range } from "~/utils/number";
import { useLocalize } from "./app-context";
import { ItemImage } from "./item-image";
import { Modal } from "./modal";

export function StickerPickerEditor({
  onChange,
  value
}: {
  onChange: (value: NonNullable<CS2BaseInventoryItem["stickers"]>) => void;
  value: NonNullable<CS2BaseInventoryItem["stickers"]>;
}) {
  const localize = useLocalize();
  const canvasRef = useRef<ComponentRef<"canvas">>(null);
  const [activeSlot, setActiveSlot] = useState<number>();
  const activeSticker =
    activeSlot !== undefined ? value[activeSlot] : undefined;

  function handleClickSlot(slot: number) {
    return function handleClickSlot() {
      setActiveSlot(slot);
    };
  }

  const [controller] = useState(() => {
    const background = new Image();
    let canvas: HTMLCanvasElement | undefined;
    let state = { stickers: value, activeIndex: activeSlot };
    let panning = false;
    let lastX = 0;
    let lastY = 0;
    let offsetX = 0;
    let offsetY = 0;
    let scale = 1.25;
    let images = new Map<number, HTMLImageElement>();
    const sh = 80;
    const sw = sh * (4 / 3);

    const handleBackgroundLoad = () => {
      if (canvas !== undefined) {
        canvas.width = background.naturalWidth;
        canvas.height = background.naturalHeight;
        offsetX = 0;
        offsetY = 0;
        render();
      }
    };

    background.onload = handleBackgroundLoad;
    background.src = "/images/schematics/m4a4.png";

    function render() {}

    return {
      hook(newCanvas: HTMLCanvasElement) {
        canvas = newCanvas;
      },

      update(newState: typeof state) {
        state = newState;
        render();
      },

      place() {
        if (canvas !== undefined && state.activeIndex !== undefined) {
          onChange({
            ...state.stickers,
            [state.activeIndex]: {
              ...value[state.activeIndex],
              x: canvas.width / 2 - sw / 2,
              y: canvas.height / 2 - sh / 2
            }
          });
        }
      }
    };
  });

  useEffect(() => {
    if (canvasRef.current !== null) {
      controller.hook(canvasRef.current);
    }
  }, [canvasRef]);

  useEffect(() => {
    controller.update({ stickers: value, activeIndex: activeSlot });
  }, [activeSlot, value]);

  return (
    <Modal className="w-[800px] pb-1" blur>
      <div className="flex select-none justify-between px-4 py-2 font-bold">
        <label className="text-sm text-neutral-400">Edit Stickers</label>
        <button className="cursor-default text-white/50 hover:text-white">
          <FontAwesomeIcon icon={faXmark} className="h-4" />
        </button>
      </div>
      <div className="flex">
        <div className="flex w-[120px] flex-col gap-1">
          {range(CS2_MAX_STICKERS).map((slot) => {
            const sticker = value[slot];
            const stickerWear = sticker?.wear ?? CS2_MIN_STICKER_WEAR;
            const item =
              sticker !== undefined
                ? CS2Economy.getById(sticker.id)
                : undefined;
            const isActive = activeSlot === slot;
            return (
              <div className="flex justify-center" key={slot}>
                <button
                  className={clsx(
                    "relative h-[69px] w-[92px] rounded border-2",
                    isActive ? "border-white" : "border-neutral-50/5"
                  )}
                  onClick={handleClickSlot(slot)}
                >
                  {item !== undefined ? (
                    <ItemImage className="h-[66px] w-[88px]" item={item} />
                  ) : (
                    localize("StickerPickerNA")
                  )}
                  {sticker !== undefined && (
                    <div className="text-outline-1 absolute bottom-0 right-1 font-display font-bold drop-shadow-lg">
                      {(stickerWear * 100).toFixed(0)}%
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
        <div className="relative flex-1">
          <canvas className="h-[389.844px] w-[678px]" ref={canvasRef} />
          {activeSticker && (
            <div className="absolute bottom-1 right-0">
              {activeSticker.x === undefined &&
                activeSticker.y === undefined && (
                  <button onClick={controller.place}>Place sticker</button>
                )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
