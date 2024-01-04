/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "~/hooks/use-translation";
import { resolveItemImage } from "~/utils/economy";
import { useRootContext } from "./root-context";

export function InventorySelectedItem({
  index,
  onDismiss
}: {
  index: number;
  onDismiss(): void;
}) {
  const { inventory } = useRootContext();
  const translate = useTranslation();
  const item = inventory.getItem(index);

  return (
    <div className="m-auto w-full px-4 pb-4 text-xs drop-shadow lg:flex lg:w-[1024px] lg:items-center lg:px-0 lg:pb-0 lg:text-base">
      <button
        className="px-2 py-1 hover:bg-black/30 active:bg-black/70"
        onClick={onDismiss}
      >
        <FontAwesomeIcon icon={faArrowLeft} className="h-5" />
      </button>
      <div className="flex flex-1 select-none items-center justify-center gap-3">
        <strong>{translate("InventorySelectAnItem")}</strong>
        <img draggable={false} className="h-12" src={resolveItemImage(item)} />
        <span className="text-neutral-300">{item.name}</span>
      </div>
    </div>
  );
}
