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
import { ComponentRef, useEffect, useRef, useState } from "react";
import { range } from "~/utils/number";
import { useLocalize } from "./app-context";
import { ItemImage } from "./item-image";
import { Modal } from "./modal";

export function StickerPickerEditor({
  value
}: {
  value: NonNullable<CS2BaseInventoryItem["stickers"]>;
}) {
  const localize = useLocalize();
  const canvasRef = useRef<ComponentRef<"canvas">>(null);
  const [controller] = useState(() => {
    const background = new Image();
    let canvas: HTMLCanvasElement | undefined;
    let stickers = value;
    let panning = false;
    let lastX = 0;
    let lastY = 0;
    let offsetX = 0;
    let offsetY = 0;
    let scale = 1.25;

    const handleBackgroundLoad = () => {
      if (canvas !== undefined) {
        canvas.width = background.naturalWidth;
        canvas.height = background.naturalHeight;
        offsetX = -(canvas.width / 2);
        offsetY = -(canvas.height / 2);
        render();
      }
    };

    background.onload = handleBackgroundLoad;
    background.src = "/images/schematics/m4a4.png";

    function render() {
      const ctx = canvas?.getContext("2d");
      if (canvas === undefined || ctx === undefined || ctx === null) {
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(scale, scale);
      ctx.translate(offsetX, offsetY);
      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    return {
      hook(newCanvas: HTMLCanvasElement) {
        canvas = newCanvas;
        canvas.onwheel = (e) => {
          e.preventDefault();
          scale += e.deltaY * -0.001;
          scale = Math.min(Math.max(1, scale), 4);
          render();
        };
        canvas.onmousedown = (e) => {
          panning = true;
          lastX = e.offsetX;
          lastY = e.offsetY;
        };
        canvas.onmousemove = (e) => {
          if (panning) {
            const dx = e.offsetX - lastX;
            const dy = e.offsetY - lastY;
            offsetX += dx;
            offsetY += dy;
            lastX = e.offsetX;
            lastY = e.offsetY;
            render();
          }
        };
        canvas.onmouseup = () => {
          panning = false;
        };
        if (background.naturalHeight !== 0) {
          handleBackgroundLoad();
        }
      },

      update(newStickers: typeof stickers) {
        stickers = newStickers;
      }
    };
  });

  useEffect(() => {
    if (canvasRef.current !== null) {
      controller.hook(canvasRef.current);
    }
  }, [canvasRef]);

  useEffect(() => {
    controller.update(value);
  }, [value]);

  return (
    <Modal className="w-[800px] pb-1" blur>
      <div className="flex select-none justify-between px-4 py-2 font-bold">
        <label className="text-sm text-neutral-400">Edit Stickers</label>
        <button className="cursor-default text-white/50 hover:text-white">
          <FontAwesomeIcon icon={faXmark} className="h-4" />
        </button>
      </div>
      <div className="flex">
        <div className="flex w-[120px] flex-col justify-center gap-1">
          {range(CS2_MAX_STICKERS).map((index) => {
            const sticker = value[index];
            const stickerWear = sticker?.wear ?? CS2_MIN_STICKER_WEAR;
            const item =
              sticker !== undefined
                ? CS2Economy.getById(sticker.id)
                : undefined;
            return (
              <div className="flex justify-center" key={index}>
                <button className="relative h-[69px] w-[92px] rounded border-2 border-neutral-50/5">
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
        <div className="flex-1">
          {/* <img draggable={false} src={"/images/schematics/m4a4.png"} /> */}
          <canvas className="h-[389.844px] w-[678px]" ref={canvasRef} />
        </div>
      </div>
    </Modal>
  );
}
