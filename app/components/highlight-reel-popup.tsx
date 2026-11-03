/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2EconomyItem } from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { has } from "~/shared/misc";
import { getAppVolume } from "~/user-storage";
import { useTranslate } from "./app-context";
import { usePresenceContext } from "./presence";

export function getHighlightReelTitle(highlight: CS2EconomyItem) {
  return [highlight.categoryName, highlight.name].filter(has).join(" | ");
}

export function HighlightReelPopup({
  highlight,
  onClose
}: {
  highlight: CS2EconomyItem;
  onClose: () => void;
}) {
  const translate = useTranslate();
  const presence = usePresenceContext();
  const isClosing = presence?.state === "closed";

  useEffect(() => {
    if (isClosing) {
      return;
    }
    function handleKeyUp(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    }
    window.addEventListener("keyup", handleKeyUp, true);
    return () => {
      window.removeEventListener("keyup", handleKeyUp, true);
    };
  }, [isClosing, onClose]);

  return createPortal(
    <div
      className={clsx(
        "fixed top-0 left-0 z-50 flex size-full items-center justify-center bg-black/60 transition-opacity duration-300 ease-in select-none starting:opacity-0",
        isClosing && "opacity-0"
      )}
      inert={isClosing}
      onTransitionEnd={(event) => {
        if (isClosing && event.target === event.currentTarget) {
          presence?.onExitComplete();
        }
      }}
      role="dialog"
    >
      <div className="flex flex-col bg-black">
        <div className="relative flex justify-center">
          <span className="font-display m-2.5 text-[20px] leading-tight text-white font-stretch-[62.5%]">
            {getHighlightReelTitle(highlight)}
          </span>
          <button
            aria-label={translate("InspectClose")}
            className="absolute top-0 right-0 m-1.5 cursor-default p-2 text-[#3b3b3b] transition-colors duration-200 ease-in hover:text-white"
            onClick={onClose}
          >
            <svg className="size-5" viewBox="0 0 32 32">
              <path
                d="M5 26.896 27 4.949M27 26.896 5 4.949"
                fill="none"
                stroke="currentColor"
                strokeWidth={5}
              />
            </svg>
          </button>
        </div>
        <video
          autoPlay
          className="pointer-events-none m-2.5 aspect-1065/600 w-[min(1065px,calc(100vw-40px))]"
          loop
          playsInline
          ref={(video) => {
            if (video !== null) {
              video.volume = getAppVolume();
            }
          }}
          src={highlight.getVideoUrl("1080p")}
        />
      </div>
    </div>,
    document.body
  );
}
