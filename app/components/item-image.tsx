/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2EconomyItem, CS2InventoryItem } from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { ComponentProps, useEffect, useState } from "react";
import { isServerContext } from "~/globals";
import { noop } from "~/utils/misc";
import { FillSpinner } from "./fill-spinner";

let cached: string[] = [];

export function ItemImage({
  className,
  item,
  lazy,
  onLoad,
  type,
  wear,
  ...props
}: Omit<ComponentProps<"img">, "onLoad"> & {
  item: CS2EconomyItem | CS2InventoryItem;
  lazy?: boolean;
  onLoad?: () => void;
  type?: "default" | "collection" | "specials";
  wear?: number;
}) {
  type ??= "default";
  const url =
    type === "default"
      ? item.getImage(wear)
      : type === "collection"
        ? item.getCollectionImage()
        : item.getSpecialsImage();

  const [loaded, setLoaded] = useState(
    cached.includes(url) || url.includes("steamcommunity")
  );

  useEffect(() => {
    if (!loaded) {
      let controller: AbortController | undefined = undefined;
      function fetchImage() {
        controller = new AbortController();
        fetch(url, { signal: controller?.signal })
          .then(() => {
            controller = undefined;
            setLoaded(true);
            if (!isServerContext) {
              cached.push(url);
            }
          })
          .catch(noop);
      }
      const idx = setTimeout(fetchImage, lazy ? 16 : 1);
      return () => {
        clearTimeout(idx);
        controller?.abort();
      };
    }
  }, [lazy, loaded]);

  useEffect(() => {
    if (loaded) {
      onLoad?.();
    }
  }, [loaded]);

  if (!loaded) {
    return (
      <div
        {...props}
        className={clsx(
          "relative flex aspect-256/192 items-center justify-center",
          className
        )}
      >
        <FillSpinner className="opacity-50" />
      </div>
    );
  }

  return (
    <img
      alt={item.name}
      draggable={false}
      src={url}
      {...props}
      className={clsx("aspect-256/192", className)}
    />
  );
}
