/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2EconomyItem, CS2InventoryItem } from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { ComponentProps, useEffect, useState } from "react";
import { isServerContext } from "~/globals";
import { cdn } from "~/utils/economy";
import { noop } from "~/utils/misc";
import { FillSpinner } from "./fill-spinner";

let cached: string[] = [];

export function ItemImage({
  item,
  lazy,
  wear,
  ...props
}: ComponentProps<"img"> & {
  item: CS2EconomyItem | CS2InventoryItem;
  lazy?: boolean;
  wear?: number;
}) {
  const url = cdn(item.getImage(wear));
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
      const idx = setTimeout(fetchImage, lazy ? 500 : 1);
      return () => {
        clearTimeout(idx);
        controller?.abort();
      };
    }
  }, [lazy, loaded]);

  if (!loaded) {
    return (
      <div
        {...props}
        className={clsx(
          "relative flex items-center justify-center",
          props.className
        )}
      >
        <FillSpinner className="opacity-50" />
      </div>
    );
  }

  return <img alt={item.name} draggable={false} src={url} {...props} />;
}
