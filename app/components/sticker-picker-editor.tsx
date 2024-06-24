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
  CS2_MIN_STICKER_WEAR,
  ensure
} from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { fabric } from "fabric";
import { ComponentRef, useEffect, useRef, useState } from "react";
import { range } from "~/utils/number";
import { useLocalize } from "./app-context";
import { ItemImage } from "./item-image";
import { Modal } from "./modal";

const CANVAS_WIDTH = 678;
const CANVAS_HEIGHT = 389.844;

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

  useEffect(() => {
    const canvas = new fabric.Canvas(canvasRef.current, {
      height: CANVAS_HEIGHT,
      width: CANVAS_WIDTH,
      selection: false
    });

    canvas.setZoom(0.8);
    const vpt = ensure(canvas.viewportTransform);
    vpt[4] -= CANVAS_WIDTH / 2;
    vpt[5] -= CANVAS_HEIGHT / 2;

    fabric.Image.fromURL("/images/schematics/m4a4.png", (img) => {
      img.set({
        left: 0,
        top: 0,
        selectable: false,
        evented: false
      });
      canvas.add(img);
      canvas.setZoom(ensure(canvas.width) / ensure(img.width));
      const vpt = ensure(canvas.viewportTransform);
      vpt[4] = (ensure(canvas.width) - ensure(img.width) * vpt[0]) / 2;
      vpt[5] = (ensure(canvas.height) - ensure(img.height) * vpt[0]) / 2;
      canvas.requestRenderAll();
    });

    canvas.on("mouse:wheel", (opt) => {
      const delta = opt.e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 20) zoom = 20;
      if (zoom < 0.01) zoom = 0.01;
      canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    let isPanning = false;
    let lastPosX = 0;
    let lastPosY = 0;

    canvas.on("mouse:down", (opt) => {
      const evt = opt.e;
      isPanning = true;
      lastPosX = evt.clientX;
      lastPosY = evt.clientY;
    });

    canvas.on("mouse:move", (opt) => {
      if (isPanning) {
        const e = opt.e;
        const vpt = ensure(canvas.viewportTransform);
        vpt[4] += e.clientX - lastPosX;
        vpt[5] += e.clientY - lastPosY;
        canvas.requestRenderAll();
        lastPosX = e.clientX;
        lastPosY = e.clientY;
      }
    });

    canvas.on("mouse:up", () => {
      isPanning = false;
    });

    return () => {
      canvas.dispose();
    };
  }, []);

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
                activeSticker.y === undefined && <button>Place sticker</button>}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
